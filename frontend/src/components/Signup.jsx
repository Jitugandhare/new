import React, { useEffect, useState } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import axios from 'axios';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';

const Signup = () => {
    const [input, setInput] = useState({
        username: "",
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const { user } = useSelector(store => store.auth);
    const navigate = useNavigate();

    const changeEventHandler = (e) => {
        const { name, value } = e.target;
        setInput(prev => ({ ...prev, [name]: value }));
    };

    const signupHandler = async (e) => {
        e.preventDefault();

        const { username, email, password } = input;

        if (!username || !email || !password) {
            return toast.error("All fields are required!");
        }

        try {
            setLoading(true);
            const res = await axios.post(
                'https://new-jfuz.onrender.com/api/v1/user/register',
                input,
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );

            if (res.data.success) {
                toast.success(res.data.message);
                setInput({ username: "", email: "", password: "" });
                navigate("/login");
            }
        } catch (error) {
            const msg = error?.response?.data?.message || "Signup failed";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) navigate("/");
    }, [user, navigate]);

    return (
        <div className='flex items-center w-screen h-screen justify-center'>
            <form onSubmit={signupHandler} className='shadow-lg flex flex-col gap-5 p-8 w-80'>
                <div className='my-4'>
                    <h1 className='text-center font-bold text-xl'>Insta-Fista</h1>
                    <p className='text-sm text-center'>Sign up to see photos & videos from your friends</p>
                </div>

                <div>
                    <span className='font-medium'>Username</span>
                    <Input
                        type="text"
                        name="username"
                        value={input.username}
                        onChange={changeEventHandler}
                        className="focus-visible:ring-transparent my-2"
                        required
                    />
                </div>

                <div>
                    <span className='font-medium'>Email</span>
                    <Input
                        type="email"
                        name="email"
                        value={input.email}
                        onChange={changeEventHandler}
                        className="focus-visible:ring-transparent my-2"
                        required
                    />
                </div>

                <div>
                    <span className='font-medium'>Password</span>
                    <Input
                        type="password"
                        name="password"
                        value={input.password}
                        onChange={changeEventHandler}
                        className="focus-visible:ring-transparent my-2"
                        required
                    />
                </div>

                <Button type='submit' disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Please wait
                        </>
                    ) : (
                        "Signup"
                    )}
                </Button>

                <span className='text-center'>
                    Already have an account?{" "}
                    <Link to="/login" className='text-blue-600'>Login</Link>
                </span>
            </form>
        </div>
    )
}

export default Signup;
