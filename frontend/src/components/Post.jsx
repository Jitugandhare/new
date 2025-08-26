import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Bookmark, MessageCircle, MoreHorizontal, Send } from 'lucide-react';
import { Button } from './ui/button';
import { FaHeart, FaRegHeart } from "react-icons/fa";
import CommentDialog from './CommentDialog';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'sonner';
import { setPosts, setSelectedPost } from '@/redux/postSlice';
import { Badge } from './ui/badge';

const Post = ({ post }) => {
    const [text, setText] = useState('');
    const [open, setOpen] = useState(false);
    const { user } = useSelector(store => store.auth);
    const { posts } = useSelector(store => store.post);
    const [comment, setComment] = useState(post.comments);
    const dispatch = useDispatch();

    const isAuthor = user?._id === post?.author?._id;
    const liked = post.likes.includes(user?._id);
    const [postLikeCount, setPostLikeCount] = useState(post.likes.length);

    const changeEventHandler = (e) => {
        const inputText = e.target.value;
        setText(inputText.trim() ? inputText : '');
    };

    const likeOrDislikeHandler = async () => {
        try {
            const action = liked ? 'dislike' : 'like';
            const res = await axios.post(
                `https://new-jfuz.onrender.com/api/v1/post/${post._id}/${action}`,
                {},
                { withCredentials: true }
            );

            if (res.data.success) {
                const updatedLikes = liked
                    ? post.likes.filter(id => id !== user._id)
                    : [...post.likes, user._id];

                const updatedPostData = posts.map(p =>
                    p._id === post._id ? { ...p, likes: updatedLikes } : p
                );

                setPostLikeCount(updatedLikes.length);
                dispatch(setPosts(updatedPostData));
                toast.success(res.data.message);
            } else {
                toast.error(res.data.message || 'Action failed.');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error while liking/disliking.');
        }
    };

    const commentHandler = async () => {
        try {
            const res = await axios.post(
                `https://new-jfuz.onrender.com/api/v1/post/${post._id}/comment`,
                { text },
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );

            if (res.data.success) {
                const updatedComments = [...comment, res.data.comment];
                setComment(updatedComments);

                const updatedPostData = posts.map(p =>
                    p._id === post._id ? { ...p, comments: updatedComments } : p
                );

                dispatch(setPosts(updatedPostData));
                toast.success(res.data.message);
                setText('');
            } else {
                toast.error(res.data.message || 'Failed to add comment.');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Comment failed.');
        }
    };

    const deletePostHandler = async () => {
        try {
            const res = await axios.delete(
                `https://new-jfuz.onrender.com/api/v1/post/delete/${post?._id}`,
                { withCredentials: true }
            );

            if (res.data.success) {
                const updatedPostData = posts.filter(p => p._id !== post?._id);
                dispatch(setPosts(updatedPostData));
                toast.success(res.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to delete post.');
        }
    };

    const bookmarkHandler = async () => {
        try {
            const res = await axios.post(
                `https://new-jfuz.onrender.com/api/v1/post/${post?._id}/bookmark`,
                {},
                { withCredentials: true }
            );

            if (res.data.success) {
                toast.success(res.data.message);
            } else {
                toast.error(res.data.message || 'Bookmark failed.');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error while bookmarking.');
        }
    };

    return (
        <div className='my-8 w-full max-w-sm mx-auto'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <Avatar>
                        <AvatarImage src={post?.author?.profilePicture || ''} alt="post_image" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className='flex items-center gap-3'>
                        <h1>{post?.author?.username}</h1>
                        {isAuthor && <Badge variant="secondary">Author</Badge>}
                    </div>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <MoreHorizontal className='cursor-pointer' />
                    </DialogTrigger>
                    <DialogContent className="flex flex-col items-center text-sm text-center">
                        {!isAuthor && (
                            <Button variant='ghost' className="cursor-pointer w-fit text-[#ED4956] font-bold">
                                Unfollow
                            </Button>
                        )}
                        <Button variant='ghost' className="cursor-pointer w-fit">
                            Add to favorites
                        </Button>
                        {isAuthor && (
                            <Button onClick={deletePostHandler} variant='ghost' className="cursor-pointer w-fit">
                                Delete
                            </Button>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <img
                className='rounded-sm my-2 w-full aspect-square object-cover'
                src={post?.image || ''}
                alt="post_img"
            />

            <div className='flex items-center justify-between my-2'>
                <div className='flex items-center gap-3'>
                    {liked ? (
                        <FaHeart
                            onClick={likeOrDislikeHandler}
                            size={24}
                            className='cursor-pointer text-red-600'
                        />
                    ) : (
                        <FaRegHeart
                            onClick={likeOrDislikeHandler}
                            size={22}
                            className='cursor-pointer hover:text-gray-600'
                        />
                    )}
                    <MessageCircle
                        onClick={() => {
                            dispatch(setSelectedPost(post));
                            setOpen(true);
                        }}
                        className='cursor-pointer hover:text-gray-600'
                    />
                    <Send className='cursor-pointer hover:text-gray-600' />
                </div>
                <Bookmark onClick={bookmarkHandler} className='cursor-pointer hover:text-gray-600' />
            </div>

            <span className='font-medium block mb-2'>{postLikeCount} likes</span>
            <p>
                <span className='font-medium mr-2'>{post?.author?.username}</span>
                {post?.caption}
            </p>

            {comment.length > 0 && (
                <span
                    onClick={() => {
                        dispatch(setSelectedPost(post));
                        setOpen(true);
                    }}
                    className='cursor-pointer text-sm text-gray-400'
                >
                    View all {comment.length} comments
                </span>
            )}

            <CommentDialog open={open} setOpen={setOpen} />

            <div className='flex items-center justify-between'>
                <input
                    type="text"
                    placeholder='Add a comment...'
                    value={text}
                    onChange={changeEventHandler}
                    className='outline-none text-sm w-full'
                />
                {text && (
                    <span onClick={commentHandler} className='text-[#3BADF8] cursor-pointer'>
                        Post
                    </span>
                )}
            </div>
        </div>
    );
};

export default Post;
