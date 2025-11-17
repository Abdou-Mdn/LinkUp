import { create } from "zustand";
import { useLayoutStore } from "./layout.store";
import { useAuthStore } from "./auth.store";
import { getChatMessages, getGroupChat, getPrivateChat } from "../lib/api/chat.api";
import { notificationSound } from "../lib/util/notification";

export const useChatStore = create((set, get) => ({
    // chat states
    selectedChat: null, // currently opened chat (null if none)
    loadingChat: false, // loading state while fetching the chat informations

    // messages states
    messages: [], // messages of the selected chat
    messagesPage: 1, // current page for pagination
    hasMoreMessages: false, // indicates if there are more messages to load 
    loadingMessages: false, // loading state for initial messages fecth
    loadingMoreMessages: false, // loading state for pagination
    limit: 30, // messages per request

    // map of last seen message per user { userID: messageID }
    lastSeenMap: {},

    // keep track of typing users
    typingUsers: [],

    // helpers
    // setter to manually update the selected chat
    updateSelectedChat: (chat) => {
        set({selectedChat: chat});
    },

    // setter to manually update the messages array
    updateMessages: (messages) => {
        set({ messages: messages});
    },

    // setter to manually update the typingUsers array
    updateTypingUsers: (newUsers) => {
        set({ typingUsers: newUsers });
    },

    // reset chat states (on logout or cleanup)
    resetChat: () => {
        set({
            selectedChat: null,
            loadingChat: false,
            messages: [],
            messagesPage: 1,
            hasMoreMessages: false,
            loadingMessages: false,
            loadingMoreMessages: false,
            lastSeenMap: {},
            typingUsers: [],
        })
    },

    // compute lastSeenMap from messages and chat participants
    updateLastSeenMap: () => {
        const participants = get().selectedChat.participants;
        const messages = get().messages;
        const authUser = useAuthStore.getState().authUser;
        const map = {}

        // initialize map with all participants
        participants.forEach((p) => {
            if(p.userID === authUser.userID) return; // skip authenticated user
            map[p.userID] = null;
        });

        // fill the map with latest seen message IDs
        messages.forEach((msg) => {
            if (!msg.seenBy) return;

            msg.seenBy.forEach((u) => {
                if(u.user == msg.sender.userID) return; // skip sender because they implicitly "see" their own message  
                if(u.user == authUser.userID) return; // skip authenticated user because we don't display it
                map[u.user] = msg.messageID;
            });
        });

        set({ lastSeenMap: map});
    },

    // return list of participants who saw a given message
    getSeenBy: (messageID) => {
        const participants = get().selectedChat.participants;
        const map = get().lastSeenMap;

        return participants.filter(p => map[p.userID] === messageID);
    },

    // chat selecttion and loading
    // select chat by chat object, userID, or groupID
    selectChat: async ({chat, userID, groupID, navigate}) => {
        if(get().loadingChat) return;
        const { setMainActive } = useLayoutStore.getState();
        // reset state while loading
        set({
            loadingChat: true,
            messages: [],
            messagesPage: 1, 
            hasMoreMessages: false, 
            loadingMessages: false, 
            loadingMoreMessages: false,
            typingUsers: [],
            selectedChat: chat || userID || groupID, // Temporary placeholder while fetching full chat details
        });
        setMainActive(true); // Ensure main panel is active/visible (UI action triggered when opening a chat)
        if(navigate) navigate(); // navigate to home page if necessary

        try {
            // update chat in case userID or groupID was provided
            let res;
            if(userID) {
                // backend will return info of the chat between authenticated user and provided userID
                // backend will return a chat placeholder in case chat between the users doesn't exist yet
                res = await getPrivateChat(userID);
            } else if (groupID) {
                // backend will return group chat info for the provided groupID 
                res = await getGroupChat(groupID);
            } else if (chat?.isGroup) {
                // if provided chat object is a group chat then we still need to load all participants
                res = await getGroupChat(chat.group.groupID);
            }

            // update chat with the backend response
            if(res?.chat) {
                set({ selectedChat: res.chat});
            }
            // load initial messages
            get().loadMessages();
        } catch (error) {
            console.log("error in get chat: ", error);
            set({ selectedChat: null });
        } finally {
            set({ loadingChat: false});
        }
    },

    // messages fetching and pagination 
    // load first page of messages
    loadMessages: async () => {
        if(!get().selectedChat?.chatID) return; // skip if no chat was opened
        set({ loadingMessages: true});
        try {
            const limit = get().limit;
            const chatID = get().selectedChat.chatID;
            
            // backend returns messages from newest to oldest + total pages
            const res = await getChatMessages(chatID, true, 1, limit);

            if(res?.messages) {
                // reverse messages (oldest to newest)
                const newMessages = res.messages.reverse();
                const totalPages = res.totalPages;

                // update states
                set({
                    messages: newMessages,
                    hasMoreMessages: 1 < totalPages,
                    messagesPage: 2
                });

                // compute lastSeenMap for the loaded messages
                get().updateLastSeenMap();
            }
        } catch (error) {
            console.log("error in loading messages: ", error)
        } finally {
            set({ loadingMessages: false});
        }
    },

    // load next page of messages
    loadMoreMessages: async () => {
        if(get().loadingMessages || get().loadingMoreMessages || !get().hasMoreMessages) return;
        set({ loadingMoreMessages: true});
        try {
            const limit = get().limit;
            const chatID = get().selectedChat.chatID;
            const page = get().messagesPage;

            const res = await getChatMessages(chatID, false, page, limit);

            if(res?.messages) {
                const newMessages = res.messages.reverse();
                const totalPages = res.totalPages;

                // prepend messages so it stays oldest to newest
                set((state) => ({
                    messages: [...newMessages, ...state.messages],
                    hasMoreMessages: page < totalPages,
                    messagesPage: page + 1,
                }));

                // compute lastSeenMap again after loading new messages
                get().updateLastSeenMap();
            }
        } catch (error) {
            console.log("error in loading messages: ", error)
        } finally {
            set({ loadingMoreMessages: false});
        }
    },

    // subscribe to messages for real time updates
    subscribeToMessages: (onReceivedMessage, onSeenMessages, onEditMessage, onDeleteMessage, setTypingUsers) => {
        const socket = useAuthStore.getState().socket;
        if(!socket) return;

        // update messages when receiving a new message
        socket.on("newMessage", ({chat, message, updatedAt}) => {
            const { selectedChat, messages, updateMessages } = get();
            onReceivedMessage(chat, message, updatedAt);
            notificationSound.play().catch(() => {}); // play notification sound when receiving a new message
            if (selectedChat && (selectedChat.chatID === Number(chat.chatID))) {
                updateMessages([...messages, message]);
            }
        });

        // update messages when messages are seen
        socket.on("seenMessages", ({chat, user, seenAt}) => {
            const { selectedChat, messages, updateMessages, updateLastSeenMap } = get();
            onSeenMessages(chat);
            if(selectedChat && (selectedChat.chatID === chat.chatID)) {
                const newMessages = messages.map(msg => {
                    if(msg.seenBy.some(u => u.user === Number(user))) return msg;

                    return {...msg, seenBy: [...msg.seenBy, {user: Number(user), seenAt: seenAt}]}
                });

                updateMessages(newMessages);
                updateLastSeenMap();
            }
        });

        // update messages when a message is edited 
        socket.on("editMessage", ({ chatID, messageID, text }) => {
            const { selectedChat, messages, updateMessages } = get();
            onEditMessage(chatID, messageID, text);
            if(selectedChat && (selectedChat === Number(chatID))) {
                const newMessages = messages.map(msg => msg.messageID == Number(messageID) ? { ...msg, text, isEdited: true } : msg);
                updateMessages(newMessages)
            }
        });

        // update messages when a message is deleted
        socket.on("deleteMessage", ({ chatID, messageID }) => {
            const { selectedChat, messages, updateMessages } = get();
            onDeleteMessage(chatID, messageID);
            if(selectedChat && (selectedChat.chatID === Number(chatID))) {
                const newMessages = messages.map(msg => msg.messageID == Number(messageID) ? { ...msg, text: "", image: "", isDeleted: true } : msg);
                updateMessages(newMessages)
            }
        });

        // update typingUsers when a user starts typing
        socket.on("typingOn", ({ chatID, userID }) => {
            const { selectedChat, typingUsers, updateTypingUsers } = get();
            if (selectedChat?.chatID !== Number(chatID)) return;
            const participant = selectedChat.participants.find(p => p.userID === Number(userID)) || null;
            if(participant && !typingUsers.some(user => user.userID === participant.userID)) {
                const newUsers = [...typingUsers, { userID: participant.userID, profilePic: participant.profilePic}];
                updateTypingUsers(newUsers);
            }
        });

        // update typingUsers when a user stops typing
        socket.on("typingOff", ({ chatID, userID }) => {
            const { selectedChat, typingUsers, updateTypingUsers } = get();
            if (selectedChat?.chatID !== Number(chatID)) return;
            const newUsers = typingUsers.filter(user => user.userID !== Number(userID));
            updateTypingUsers(newUsers);
            
        });
    },

    // unsubscribe from messages
    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if(socket) {
            socket.off("newMessage");
            socket.off("seenMessages");
            socket.off("editMessage");
            socket.off("deleteMessage");
            socket.off("typingOn");
            socket.off("typingOff");
        }
    }
}))