import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import useGetAllMessage from '@/hooks/useGetAllMessage'
import useGetRTM from '@/hooks/useGetRTM'

const Messages = ({ selectedUser }) => {
    useGetRTM();
    useGetAllMessage();
    const { messages } = useSelector(store => store.chat);
    const { user } = useSelector(store => store.auth);

    return (
        <div className="overflow-y-auto flex-1 p-6 bg-gray-50">
            <div className="flex justify-center">
                <div className="flex flex-col items-center justify-center">
                    <Avatar className="h-20 w-20 border-2 border-blue-500 rounded-full shadow-lg">
                        <AvatarImage src={selectedUser?.profilePicture} alt="profile" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <span className="text-xl font-semibold mt-2">{selectedUser?.username}</span>
                    <Link to={`/profile/${selectedUser?._id}`}>
                        <Button className="h-8 my-2 px-6 py-2 rounded-full text-sm" variant="secondary">View Profile</Button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-col gap-4 mt-6">
                {
                    messages && messages.map((msg) => {
                        return (
                            <div key={msg._id} className={`flex ${msg.senderId === user?._id ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`p-4 rounded-lg max-w-xs break-words shadow-md ${
                                        msg.senderId === user?._id
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-black'
                                    }`}
                                    style={{
                                        animation: msg.senderId === user?._id ? 'fadeIn 0.3s ease-out' : 'fadeInReverse 0.3s ease-out'
                                    }}
                                >
                                    {msg.message}
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}

export default Messages;
