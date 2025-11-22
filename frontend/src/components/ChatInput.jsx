import React, { forwardRef, useEffect, useRef, useState } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

import { CircleCheck, FileImage, Image, Laugh, Mail, MessageSquareQuote, Send, SquarePen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useThemeStore } from '../store/theme.store'
import { useChatStore } from '../store/chat.store';
import { useAuthStore } from '../store/auth.store';

import { editMessage, sendMessage } from '../lib/api/chat.api';
import { createOptimisticMessage } from '../lib/util/messages';

import PrimaryButton from './PrimaryButton'

/* 
 * ChatInput Component
 
 * Displays the chat input of the chat container
  
 * Integrates with API functions:
 * - `sendMessage`, `editMessage`,
 
 * Forwards a ref of the text input to the parent component (used to focus the input) 

 * params:
 * - chat: selected chat infos
 * - text: state of the input's text
 * - setText: setter to update the input's text
 * - imagePreview: state of uploaded image to send
 * - setImagePreview: setter to update the image
 * - replyTo: state of the target message to reply to
 * - setReplyTp: setter to update the target message
 * - edit: state of the message to edit
 * - setEdit: setter to update the message to edit
 * - onSendMessage: callback function to update messages and chat after sending message
 * - onEditMessage: callback function to update messages and chat after editing message
*/
const ChatInput = forwardRef(({chat, text, setText, imgPreview, setImgPreview, replyTo, setReplyTo, edit, setEdit, onSendMessage, onEditMessage}, ref) => {
    const { theme } = useThemeStore();
    const { messages, updateMessages, selectedChat } = useChatStore();
    const { authUser, socket } = useAuthStore();

    // emoji picker visivility state
    const [showPicker, setShowPicker] = useState(false);
    // image uploader input ref
    const fileInputRef = useRef(null);

    // loading state
    const [loading, setLoading] = useState(false);

    // typing state
    const [isTyping, setIsTyping] = useState(false);

    // timeout for typing (if is not typing for 2s then stop)
    let typingTimeout;

    // handle uploading the image
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        // accept only images
        if(!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        const reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64Image = reader.result;
            setImgPreview(base64Image);
        }
    }

    // handle remove uploaded image
    const removeImage = () => {
        setImgPreview(null);
        if(fileInputRef.current) fileInputRef.current.value = '';
    }

    // dynamic resize of input textarea
    useEffect(() => {
        const textInput = ref.current;
        if (!textInput) return;

        // reset height to "auto" so the browser recalculates the correct scrollHeight
        textInput.style.height = "auto";

        // Define line height and maximum allowed height
        const lineHeight = 24; // each line is ~24px tall
        const maxHeight = lineHeight * 3; // limit to 3 lines of text

        // adjust the height dynamically:
        // - use the element's scrollHeight (actual content height)
        // - cap it at the maxHeight so it doesn’t keep growing indefinitely
        textInput.style.height = Math.min(textInput.scrollHeight, maxHeight) + "px";
    }, [text]);

    // handle imoji select (insert into text)
    const handleEmojiSelect = (emoji) => {
        // get text area via ref
        const input = ref.current;

        // get the current cursor position
        const start = input.selectionStart;
        const end = input.selectionEnd;

        // Split text around the cursor
        const before = text.slice(0, start); // text before the cursor
        const after = text.slice(end); // text after the cursor

        // construct new text by inserting emoji at the cursor position
        const newText = before + emoji.native + after;

        // update state with new text
        setText(newText);
    };

    // handle send message
    const handleSendMessage = async () => {
        try {
            // get message receiver if it's private chat (receiverID will be used if chat is not created yet i.e. first message of the chat)
            let receiver = null;
            if(!chat.isGroup && !chat.chatID) {
                receiver = chat.participants.filter(p => p.userID !== authUser.userID)[0];
            }

            // create optimistic message
            const optimisticMessage = createOptimisticMessage({
                sender: authUser,
                chatID: chat.chatID,
                receiverID: receiver ? receiver.userID : null,
                text,
                image: imgPreview,
                replyTo,
            });

            // append the optimistic message to the messages 
            const newMessages = [...messages, optimisticMessage]
            updateMessages(newMessages);

            // clear states
            setText("");
            setImgPreview(null);
            setReplyTo(null);
            ref.current.focus();

            // send to backend
            const res = await sendMessage({
                chatID: chat.chatID,
                receiverID: receiver ? receiver.userID : null,
                text,
                image: imgPreview,
                replyTo: replyTo ? replyTo.messageID : null,
            });

            
            if(res?.newMessage) {
                // Replace optimistic message with real one
                const newMessages = useChatStore.getState().messages.map(msg =>
                    msg.tempID === optimisticMessage.tempID ? res.newMessage : msg
                )
                updateMessages(newMessages);
                // update the chat list
                onSendMessage(res.chat, res.newMessage, res.updatedAt);
            } else {
                // mark message as failed if no valid response
                const newMessages = useChatStore.getState().messages.map(msg =>
                    msg.tempID === optimisticMessage.tempID ? { ...msg, status: "failed" } : msg
                );
                updateMessages(newMessages); 
            }

        } catch (error) {
            console.log("error in sending message", error);
            // mark message as failed
            const newMessages = useChatStore.getState().messages.map(msg =>
                msg.tempID === optimisticMessage.tempID ? { ...msg, status: "failed" } : msg
            );
            updateMessages(newMessages);
        }
    }

    // handle edit message
    const handleEditMessage = async () => {
        if(loading || !edit) return;
        setLoading(true);
        try {
            const res = await editMessage(edit.messageID, text);

            if(res?.updatedMessage) {
                const newMessages = messages.map(msg => msg.messageID == edit.messageID ? { ...msg, text, isEdited: true } : msg);
                updateMessages(newMessages);
                onEditMessage(edit.chatID, edit.messageID, text);
            }

            // clear states
            setText("");
            setImgPreview(null);
            setEdit(null);
            ref.current.focus();
        } catch (error) {
            console.log("error in editing message", error);
        } finally {
            setLoading(false)
        }
    }

    // handle typing 
    const handleTyping = () => {
        if (!socket || !selectedChat) return;

        // emit typingOn only once when starting to type
        if (!isTyping) {
            setIsTyping(true);
            socket.emit("typingOn", {
                chatID: selectedChat.chatID,
                userID: authUser.userID
            });
        }

        // restart timeout 
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            setIsTyping(false);
            socket.emit("typingOff", {
                chatID: selectedChat.chatID,
                userID: authUser.userID
            });
        }, 2000); // stop after 2s of no typing
    }

  return (
    <div className={`px-3 pb-3 mt-2 w-full relative z-20`}>
        {/* uploaded image preview */}
        {imgPreview && (
            <div className='mb-3 flex items-center gap-2 absolute -top-25 z-10'>
                <div className='relative'>
                    <img 
                        src={imgPreview} className='w-25 h-25 object-cover rounded-lg border border-light-300 dark:border-dark-300'
                    />
                    {/* remove image button */}
                    <button
                        type='button'
                        onClick={removeImage}
                        className='absolute -top-0.5 -right-0.5 cursor-pointer bg-light-300 dark:bg-dark-300 rounded-full flex items-center justify-center'
                    >
                        <X className='size-5'/>
                    </button>
                </div>
            </div>
        )}
        {/* replyTo message informations */}
        <AnimatePresence>
        {
            replyTo && (
                <motion.div 
                    className='w-full border-t border-light-txt2 dark:border-dark-txt2 flex items-center justify-between gap-2 py-1 px-2 lg:px-8'
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                >
                    <div className='flex items-center gap-2 lg:gap-4 max-w-[85%]'>
                        {/* icon based on message type (groupInvite/ photo/ text) */}
                        { replyTo.groupInvite ? <Mail className='size-6 lg:size-8' /> : (replyTo.image && !replyTo.text) ? <FileImage className='size-6 lg:size-8' /> : <MessageSquareQuote className='size-6 lg:size-8' />}
                        {/* message infos */}
                        <div className='flex-1 flex flex-col max-w-[85%]'>
                            {/* "reply to:" title */}
                            <span className='text-light-txt dark:text-dark-txt text-sm lg:text-lg font-bold'>Reply to :</span>
                            {/* message type (group invite/ photo/ text) */}
                            <span className='text-light-txt2 dark:text-dark-txt2 truncate text-sm'>
                                { replyTo.groupInvite ? 'Group Invite' : (replyTo.image && !replyTo.text) ? 'Photo' : replyTo.text}            
                            </span>
                        </div>
                    </div>
                    {/* cancel reply button */}
                    <button 
                        className='hover:bg-light-300 hover:dark:bg-dark-300 p-1
                        .5 lg:p-3 rounded-full cursor-pointer text-light-txt2 dark:text-dark-txt2'
                        onClick={() => setReplyTo(null)}
                    >
                        <X className='size-6' />
                    </button>
                </motion.div>
            )
        }
        </AnimatePresence>
        {/* edit message */}
        <AnimatePresence>
        {
            edit && (
                <motion.div 
                    className='w-full border-t border-light-txt2 dark:border-dark-txt2 flex items-center justify-between gap-2 py-1 px-2 lg:px-8'
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                >
                    {/* "edit:" title */}
                    <div className='flex items-center gap-2 lg:gap-4 max-w-[85%] ml-4'>
                        <SquarePen className='size-6 lg:size-8' />
                        <div className='flex-1 text-light-txt dark:text-dark-txt text-lg font-bold'>Edit :</div>
                    </div>
                    {/* cancel edit button */}
                    <button 
                        className='hover:bg-light-300 hover:dark:bg-dark-300 p-1.5 lg:p-3 rounded-full cursor-pointer text-light-txt2 dark:text-dark-txt2'
                        onClick={() => { setEdit(null); setText('')}}
                    >
                        <X className='size-6' />
                    </button>
                </motion.div>
            )
        }
        </AnimatePresence>
        {/* input & buttons form */}
        <form 
            className='flex items-center justify-center gap-2'
        >
            {/* image input */}
            <input 
                type="file"
                accept='image/*'
                className='hidden'
                ref={fileInputRef}
                onChange={handleImageSelect} 
            />
            {/* image trigger button (opens image uploader) */}
            <button
                title={edit ? 'You can only edit the text' : 'Add image'}
                type='button'
                className={`hover:bg-light-300 hover:dark:bg-dark-300 p-1.5 lg:p-3 rounded-xl ${edit ? 'cursor-not-allowed' : 'cursor-pointer'} ${imgPreview ? "text-secondary" : "text-light-txt2 dark:text-dark-txt2"}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={edit ? true : false}
            >
                <Image className='size-5 lg:size-6'/>
            </button>
            {/* message text input */}
            <textarea 
                ref={ref}
                placeholder='Type something...'
                value={text}
                onChange={(e) => setText(e.target.value)}
                onInput={handleTyping}
                rows={1}
                maxLength={15000}
                className='p-1.5 lg:p-3 pl-2.5 lg:pl-4 w-full rounded-xl outline-0 focus:outline-2 resize-none text-sm lg:text-normal
                outline-secondary bg-light-300 text-light-txt dark:bg-dark-300 dark:text-dark-txt' 
                // handle press enter to submit (shift + enter to jump to next line) 
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault(); 
                        edit ? handleEditMessage() : handleSendMessage(); 
                    }
                }}
            />
            {/* emoji button */}
            <div className='relative'>
                {/* trigger emoji picker visibility */}
                <button
                    title={showPicker ? 'Close emoji picker' : 'Add emoji'}
                    type='button'
                    className={`hover:bg-light-300 hover:dark:bg-dark-300 p-1.5 lg:p-3 rounded-xl cursor-pointer ${showPicker ? "text-secondary" : "text-light-txt2 dark:text-dark-txt2"}`}
                    onClick={() => setShowPicker(!showPicker)}
                >
                   {
                    showPicker ? <X className='size-5 lg;size-6'/> : <Laugh className='size-5 lg;size-6'/> 
                   }
                </button>
                {/* emoji picker */}
                <AnimatePresence>
                { showPicker && (
                    <motion.div 
                        className='flex items-center justify-center absolute  -top-[450px] lg:-top-[440px] -right-[150%] lg:right-0 shadow-2xl rounded-lg'
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 15, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}    
                    >
                        <Picker 
                            onEmojiSelect={handleEmojiSelect} 
                            data={data}
                            previewPosition="none"
                            icons="outline"
                            navPosition="bottom"
                            theme={theme}
                        />
                    </motion.div> 
                )}
                </AnimatePresence>
            </div>
            {/* submit buttons */}
            { edit ? 
                // check button in case it's edit
                <PrimaryButton 
                    type='button'
                    toolip='Save'
                    leftIcon={<CircleCheck className='size-5 lg:size-6' />}
                    className='p-2 lg:p-3 rounded-xl'
                    disabled={!text || (text == edit.text)}
                    loading={loading}
                    onClick={handleEditMessage}
                /> :
                // send button
                <PrimaryButton 
                    type='button'
                    toolip='Send'
                    leftIcon={<Send className='size-5 lg:size-6' />}
                    className='py-2 px-2 lg:py-3 lg:px-5 rounded-xl'
                    disabled={!text && !imgPreview}
                    onClick={handleSendMessage}
                />
            }
        </form>
    </div>
  )
})

export default ChatInput