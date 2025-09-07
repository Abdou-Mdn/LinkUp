import { CircleCheck, FileImage, Image, Laugh, Mail, MessageSquareQuote, Send, SquarePen, X } from 'lucide-react';
import React, { forwardRef, useEffect, useRef, useState } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useThemeStore } from '../store/theme.store'
import PrimaryButton from './PrimaryButton'
import { editMessage, sendMessage } from '../lib/api/chat.api';
import { useChatStore } from '../store/chat.store';
import { useAuthStore } from '../store/auth.store';


const ChatInput = forwardRef(({chat, text, setText, imgPreview, setImgPreview, replyTo, setReplyTo, edit, setEdit, onSendMessage, onEditMessage}, ref) => {
    const { theme } = useThemeStore();
    const { messages, updateMessages } = useChatStore();
    const { authUser } = useAuthStore();

    const [showPicker, setShowPicker] = useState(false);
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(false);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if(!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImgPreview(reader.result);
        }
        reader.readAsDataURL(file);
    }

    const removeImage = () => {
        setImgPreview(null);
        if(fileInputRef.current) fileInputRef.current.value = '';
    }

    useEffect(() => {
        const textInput = ref.current;
        if (!textInput) return;

        textInput.style.height = "auto";

        const lineHeight = 24;
        const maxHeight = lineHeight * 3;

        textInput.style.height = Math.min(textInput.scrollHeight, maxHeight) + "px";
    }, [text]);

    const handleEmojiSelect = (emoji) => {
        const input = ref.current;
        const start = input.selectionStart;
        const end = input.selectionEnd;

        const before = text.slice(0, start);
        const after = text.slice(end);

        const newText = before + emoji.native + after;
        setText(newText);
    };

    const handleSendMessage = async () => {
        if(loading) return;
        try {
            setLoading(true);
            let receiver = null;
            if(!chat.isGroup && !chat.chatID) {
                receiver = chat.participants.filter(p => p.userID !== authUser.userID)[0];
            }
            const res = await sendMessage({
                chatID: chat.chatID,
                receiverID: receiver ? receiver.userID : null,
                text,
                image: imgPreview,
                replyTo: replyTo ? replyTo.messageID : null,
            });

            if(res?.newMessage) {
                const newMessages = [...messages, res.newMessage];
                updateMessages(newMessages);
                onSendMessage(res.chat);
            }

            setText("");
            setImgPreview(null);
            setReplyTo(null);
            ref.current.focus();
        } catch (error) {
            console.log("error in sending message", error);
        } finally {
            setLoading(false)
        }
    }

    const handleEditMessage = async () => {
        if(loading || !edit) return;
        try {
            setLoading(true);
            const res = await editMessage(edit.messageID, text);

            if(res?.updatedMessage) {
                const newMessages = messages.map(msg => msg.messageID == edit.messageID ? { ...msg, text, isEdited: true } : msg);
                updateMessages(newMessages);
                onEditMessage(edit.chatID, edit.messageID, text);
            }

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


  return (
    <div className={`px-3 pb-3 mt-2 w-full relative`}>
        {imgPreview && (
            <div className='mb-3 flex items-center gap-2 absolute -top-25 z-10'>
                <div className='relative'>
                    <img 
                        src={imgPreview} className='w-25 h-25 object-cover rounded-lg border-1 border-light-300 dark:border-dark-300'
                    />
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
        {
            replyTo && (
                <div className='w-full border-t-1 border-light-txt2 dark:border-dark-txt2 flex items-center gap-4 py-1 px-8'>
                    { replyTo.groupInvite ? <Mail className='size-8' /> : (replyTo.image && !replyTo.text) ? <FileImage className='size-8' /> : <MessageSquareQuote className='size-8' />}
                    <div className='flex-1 flex flex-col'>
                        <span className='text-light-txt dark:text-dark-txt text-lg font-bold'>Reply to :</span>
                        <span className='text-light-txt2 dark:text-dark-txt2 truncate'>
                            { replyTo.groupInvite ? 'Group Invite' : (replyTo.image && !replyTo.text) ? 'Photo' : replyTo.text}            
                        </span>
                    </div>
                    <button 
                        className='hover:bg-light-300 hover:dark:bg-dark-300 p-3 rounded-full cursor-pointer text-light-txt2 dark:text-dark-txt2'
                        onClick={() => setReplyTo(null)}
                    >
                        <X className='size-6' />
                    </button>
                </div>
            )
        }
        {
            edit && (
                <div className='w-full border-t-1 border-light-txt2 dark:border-dark-txt2 flex items-center gap-4 py-1 px-8'>
                    <SquarePen className='size-8' />
                    <div className='flex-1 text-light-txt dark:text-dark-txt text-lg font-bold'>Edit :</div>
                    <button 
                        className='hover:bg-light-300 hover:dark:bg-dark-300 p-3 rounded-full cursor-pointer text-light-txt2 dark:text-dark-txt2'
                        onClick={() => { setEdit(null); setText('')}}
                    >
                        <X className='size-6' />
                    </button>
                </div>
            )
        }
        <form 
            className='flex items-center justify-center gap-2'
        >
            <input 
                type="file"
                accept='image/*'
                className='hidden'
                ref={fileInputRef}
                onChange={handleImageSelect} 
            />
            <button
                title='Add image'
                type='button'
                className={`hover:bg-light-300 hover:dark:bg-dark-300 p-3 rounded-full cursor-pointer ${imgPreview ? "text-secondary" : "text-light-txt2 dark:text-dark-txt2"}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={edit ? true : false}
            >
                <Image className='size-6'/>
            </button>
            <textarea 
                ref={ref}
                placeholder='Type something...'
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={1}
                maxLength={15000}
                className='p-3 pl-4 w-full rounded-3xl outline-0 focus:outline-2 resize-none
                outline-secondary bg-light-300 text-light-txt dark:bg-dark-300 dark:text-dark-txt' 
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault(); 
                        edit ? handleEditMessage() : handleSendMessage(); 
                    }
                }}
            />
            <div className='relative'>
                <button
                    title='Add emoji'
                    type='button'
                    className={`hover:bg-light-300 hover:dark:bg-dark-300 p-3 rounded-full cursor-pointer ${showPicker ? "text-secondary" : "text-light-txt2 dark:text-dark-txt2"}`}
                    onClick={() => setShowPicker(!showPicker)}
                >
                    <Laugh className='size-6'/>
                </button>
                { showPicker && (
                    <div className='flex items-center justify-center absolute -top-[440px] right-0 shadow-2xl rounded-lg'>
                        <Picker 
                            onEmojiSelect={handleEmojiSelect} 
                            data={data}
                            previewPosition="none"
                            icons="outline"
                            navPosition="bottom"
                            theme={theme}
                        />
                    </div> 
                )}
            </div> 
            { edit ? 
                <PrimaryButton 
                    type='button'
                    toolip='Save'
                    leftIcon={<CircleCheck className='size-6' />}
                    className='p-3 rounded-3xl'
                    disabled={!text || (text == edit.text)}
                    loading={loading}
                    onClick={handleEditMessage}
                /> :
                <PrimaryButton 
                    type='button'
                    toolip='Send'
                    leftIcon={<Send className='size-6' />}
                    className='py-3 px-5 rounded-3xl'
                    disabled={!text && !imgPreview}
                    loading={loading}
                    onClick={handleSendMessage}
                />
            }
        </form>
    </div>
  )
})

export default ChatInput