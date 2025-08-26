import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import axios from 'axios';
import { setAuthUser } from '@/redux/authSlice';

const SuggestedUsers = () => {
    const dispatch = useDispatch();
    const { suggestedUsers, user } = useSelector(store => store.auth);
    const [loadingIds, setLoadingIds] = useState([]); // tracks follow/unfollow loading states

    // Check if logged-in user follows a suggested user
    const isFollowing = (userId) => {
        return user?.following?.some(id => id.toString() === userId.toString());
    };

    const handleFollowToggle = async (targetUserId) => {
        if (!user) return; // optionally prompt login

        if (loadingIds.includes(targetUserId)) return; // avoid multiple requests

        setLoadingIds(prev => [...prev, targetUserId]);

        try {
            const res = await axios.post(
                `https://new-jfuz.onrender.com/api/v1/user/followorunfollow/${targetUserId}`
                ,
                {},
                { withCredentials: true } // send cookies if any
            );

            if (res.data.success && res.data.updatedUser) {
                // Update auth user in redux store with updated data
                dispatch(setAuthUser(res.data.updatedUser));
            }
        } catch (error) {
            console.error("Follow/unfollow error:", error);
        } finally {
            setLoadingIds(prev => prev.filter(id => id !== targetUserId));
        }
    };

    return (
        <div className='my-10'>
            <div className='flex items-center justify-between text-sm'>
                <h1 className='font-semibold text-gray-600'>Suggested for you</h1>
                <span className='font-medium cursor-pointer'>See All</span>
            </div>

            {suggestedUsers.map(userItem => {
                const followed = isFollowing(userItem._id);
                const loading = loadingIds.includes(userItem._id);

                return (
                    <div key={userItem._id} className='flex items-center justify-between my-5'>
                        <div className='flex items-center gap-2'>
                            <Link to={`/profile/${userItem._id}`}>
                                <Avatar>
                                    <AvatarImage src={userItem?.profilePicture} alt="profile_image" />
                                    <AvatarFallback>CN</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div>
                                <h1 className='font-semibold text-sm'>
                                    <Link to={`/profile/${userItem._id}`}>{userItem?.username}</Link>
                                </h1>
                                <span className='text-gray-600 text-sm'>{userItem?.bio || 'Bio here...'}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleFollowToggle(userItem._id)}
                            disabled={loading}
                            className={`text-xs font-bold px-4 py-1 rounded ${followed
                                    ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                    : 'bg-[#3BADF8] text-white hover:bg-[#3495d6]'
                                }`}
                        >
                            {loading ? 'Please wait...' : followed ? 'Following' : 'Follow'}
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default SuggestedUsers;
