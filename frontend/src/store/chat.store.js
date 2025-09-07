import { create } from "zustand";
import { getChatMessages, getGroupChat, getPrivateChat } from "../lib/api/chat.api";
import { useLayoutStore } from "./layout.store";

export const useChatStore = create((set, get) => ({
    selectedChat: null,
    loadingChat: false,

    messages: [],
    messagesPage: 1,
    hasMoreMessages: false,
    loadingMessages: false,
    loadingMoreMessages: false,
    limit: 30,

    lastSeenMap: {},

    updateSelectedChat: (chat) => {
        set({selectedChat: chat});
    },

    updateMessages: (messages) => {
        set({ messages: messages});
    },

    updateLastSeenMap: () => {
        const participants = get().selectedChat.participants;
        const messages = get().messages;

        const map = {}

        participants.forEach((p) => {
            map[p.userID] = null;
        });

        messages.forEach((msg) => {
            if (!msg.seenBy) return;

            msg.seenBy.forEach((u) => {
                if(u.user == msg.sender.userID) return; 
                map[u.user] = msg.messageID;
            });
        });

        set({ lastSeenMap: map});
    },

    getSeenBy: (messageID) => {
        const participants = get().selectedChat.participants;
        const map = get().lastSeenMap;

        return participants.filter(p => map[p.userID] === messageID);
    },

    selectChat: async ({chat, userID, groupID, navigate}) => {
        if(get().loadingChat) return;
        const { setMainActive } = useLayoutStore.getState();
        set({
            loadingChat: true,
            messages: [],
            selectedChat: chat || userID || groupID,
        });
        setMainActive(true);
        if(navigate) navigate();

        try {
            let res;
            if(userID) {
                res = await getPrivateChat(userID);
            } else if (groupID) {
                res = await getGroupChat(groupID);
            } else if (chat?.isGroup) {
                res = await getGroupChat(chat.group.groupID);
            }

            if(res?.chat) {
                set({ selectedChat: res.chat});
            }

            get().loadMessages();
        } catch (error) {
            console.log("error in get chat: ", error);
            set({ selectedChat: null });
        } finally {
            set({ loadingChat: false});
        }
    },

    loadMessages: async () => {
        if(!get().selectedChat?.chatID) return;
        set({ loadingMessages: true});
        try {
            const limit = get().limit;
            const chatID = get().selectedChat.chatID;
            const res = await getChatMessages(chatID, true, 1, limit);

            if(res?.messages) {
                const newMessages = res.messages.reverse();
                const totalPages = res.totalPages;

                set({
                    messages: newMessages,
                    hasMoreMessages: 1 < totalPages,
                    messagesPage: 2
                });

                get().updateLastSeenMap();
            }
        } catch (error) {
            console.log("error in loading messages: ", error)
        } finally {
            set({ loadingMessages: false});
        }
    },

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

                set((state) => ({
                    messages: [...newMessages, ...state.messages],
                    hasMoreMessages: page < totalPages,
                    messagesPage: page + 1,
                }));
                get().updateLastSeenMap();
            }
        } catch (error) {
            console.log("error in loading messages: ", error)
        } finally {
            set({ loadingMoreMessages: false});
        }
    },

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
        })
    }
}))