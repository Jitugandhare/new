import {
    Heart,
    Home,
    LogOut,
    MessageCircle,
    PlusSquare,
    Search,
    TrendingUp
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { toast } from 'sonner'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setAuthUser } from '@/redux/authSlice'
import CreatePost from './CreatePost'
import { setPosts, setSelectedPost } from '@/redux/postSlice'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

const LeftSidebar = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useSelector((store) => store.auth)
    const { likeNotification } = useSelector((store) => store.realTimeNotification)
    const dispatch = useDispatch()
    const [open, setOpen] = useState(false)

    useEffect(() => {
        // 🧠 Show notification count in document title
        if (likeNotification?.length > 0) {
            document.title = `(${likeNotification.length}) Insta-Fista`
        } else {
            document.title = 'Insta-Fista'
        }
    }, [likeNotification])

    const logoutHandler = async () => {
        try {
            const res = await axios.get('https://new-jfuz.onrender.com/api/v1/user/logout', { withCredentials: true })
            if (res.data.success) {
                dispatch(setAuthUser(null))
                dispatch(setSelectedPost(null))
                dispatch(setPosts([]))
                navigate('/login')
                toast.success(res.data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong!')
        }
    }

    const sidebarHandler = (textType) => {
        switch (textType) {
            case 'Logout':
                logoutHandler()
                break
            case 'Create':
                setOpen(true)
                break
            case 'Profile':
                navigate(`/profile/${user?._id}`)
                break
            case 'Home':
                navigate('/')
                break
            case 'Messages':
                navigate('/chat')
                break
            case 'Search':
                navigate('/search')
                break
            case 'Explore':
                navigate('/explore')
                break
        }
    }

    const sidebarItems = [
        { icon: <Home />, text: 'Home', path: '/' },
        { icon: <Search />, text: 'Search', path: '/search' },
        { icon: <TrendingUp />, text: 'Explore', path: '/explore' },
        { icon: <MessageCircle />, text: 'Messages', path: '/chat' },
        {
            icon: <Heart />,
            text: 'Notifications',
            path: null
        },
        { icon: <PlusSquare />, text: 'Create', path: null },
        {
            icon: (
                <Avatar className="w-6 h-6">
                    <AvatarImage src={user?.profilePicture} alt="@profile" loading="lazy" />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
            ),
            text: 'Profile',
            path: `/profile/${user?._id}`
        },
        { icon: <LogOut />, text: 'Logout', path: null }
    ]

    return (
        <TooltipProvider>
            <div className="fixed top-0 z-10 left-0 px-4 border-r border-gray-300 w-[16%] min-w-[70px] h-screen bg-white dark:bg-gray-950 hidden sm:block">
                <div className="flex flex-col">
                    <h1 className="my-8 pl-3 font-bold text-xl hidden lg:block">Insta-Fista</h1>
                    <div>
                        {sidebarItems.map((item, index) => {
                            const isActive = item.path && location.pathname === item.path

                            return (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                        <div
                                            onClick={() => sidebarHandler(item.text)}
                                            className={`flex items-center gap-3 relative cursor-pointer rounded-lg p-3 my-3 transition-all duration-200 ${
                                                isActive ? 'bg-gray-200 dark:bg-gray-800 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            {item.icon}
                                            <span className="hidden lg:inline">{item.text}</span>

                                            {item.text === 'Notifications' && likeNotification.length > 0 && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            className="rounded-full h-5 w-5 bg-red-600 hover:bg-red-600 absolute bottom-6 left-6 text-white text-xs"
                                                        >
                                                            {likeNotification.length}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-64">
                                                        <div>
                                                            {likeNotification.length === 0 ? (
                                                                <p>No new notifications</p>
                                                            ) : (
                                                                likeNotification.map((notification) => (
                                                                    <div key={notification.userId} className="flex items-center gap-2 my-2">
                                                                        <Avatar className="w-8 h-8">
                                                                            <AvatarImage
                                                                                src={notification.userDetails?.profilePicture}
                                                                                loading="lazy"
                                                                                alt={notification.userDetails?.username}
                                                                            />
                                                                            <AvatarFallback>CN</AvatarFallback>
                                                                        </Avatar>
                                                                        <p className="text-sm">
                                                                            <span className="font-bold">{notification.userDetails?.username}</span> liked
                                                                            your post
                                                                        </p>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p>{item.text}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </div>
                </div>

                <CreatePost open={open} setOpen={setOpen} />
            </div>
        </TooltipProvider>
    )
}

export default LeftSidebar
