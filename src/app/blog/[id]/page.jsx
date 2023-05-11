"use client"
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import classes from './blog.module.css'
import { BsFillPencilFill } from 'react-icons/bs'
import { AiFillDelete, AiFillLike, AiOutlineLike } from 'react-icons/ai'
import Link from 'next/link'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { format } from 'timeago.js'
import { useRouter } from 'next/navigation'
import Comment from '@/components/comment/Comment'
import person from '../../../../public/person.jpg'

const BlogDetails = (ctx) => {
    const [blogDetails, setBlogDetails] = useState("")
    const [isLiked, setIsLiked] = useState(false)
    const [blogLikes, setBlogLikes] = useState(0)

    const [commentText, setCommentText] = useState("")
    const [comments, setComments] = useState([])

    const { data: session } = useSession()
    const router = useRouter()

    useEffect(() => {
      async function fetchComments(){
        const res = await fetch(`http://localhost:3000/api/comment/${ctx.params.id}`, {cache: 'no-store'})
        const comments = await res.json()

        setComments(comments)
      }
      fetchComments()
    }, [])


    useEffect(() => {
        async function fetchBlog() {
            const res = await fetch(`http://localhost:3000/api/blog/${ctx.params.id}`, { cache: 'no-store' })
            const blog = await res.json()

            setBlogDetails(blog)
            setIsLiked(blog?.likes?.includes(session?.user?._id))
            setBlogLikes(blog?.likes?.length || 0)
        }
        session && fetchBlog()
    }, [session])

    const handleDelete = async () => {
        try {
            const confirmModal = confirm("Are you sure you want to delete your blog?")

            if (confirmModal) {
                const res = await fetch(`http://localhost:3000/api/blog/${ctx.params.id}`, {
                    headers: {
                        'Authorization': `Bearer ${session?.user?.accessToken}`
                    },
                    method: "DELETE"
                })

                if (res.ok) {
                    router.push('/')
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleLike = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/blog/${ctx.params.id}/like`, {
                headers: {
                    'Authorization': `Bearer ${session?.user?.accessToken}`
                },
                method: 'PUT'
            })

            console.log(res)
            if (res.ok) {
                if (isLiked) {
                    setIsLiked(prev => !prev)
                    setBlogLikes(prev => prev - 1)
                } else {
                    setIsLiked(prev => !prev)
                    setBlogLikes(prev => prev + 1)
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleComment = async () => {
        if(commentText?.length < 2){
            toast.error("Comment must be at least 2 characters long")
            return
        }

        try {
            const body = {
                blogId: ctx.params.id,
                authorId: session?.user?._id,
                text: commentText
            }

            const res = await fetch(`http://localhost:3000/api/comment`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.user?.accessToken}`
                },
                method: "POST",
                body: JSON.stringify(body)
            })

            const newComment = await res.json()

            setComments((prev) => {
                return [newComment, ...prev]
            })
            
            setCommentText("")
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className={classes.container}>
            <div className={classes.wrapper}>
                <Image src={blogDetails?.imageUrl} width='750' height='650' />
                <div className={classes.row}>
                    <h3 className={classes.title}>{blogDetails?.title}</h3>
                    {
                        blogDetails?.authorId?._id.toString() === session?.user?._id.toString()
                            ? (
                                <div className={classes.controls}>
                                    <Link className={classes.editButton} href={`/blog/edit/${ctx.params.id}`}>
                                        Edit <BsFillPencilFill />
                                    </Link>
                                    <button onClick={handleDelete} className={classes.deleteButton}>
                                        Delete
                                        <AiFillDelete />
                                    </button>
                                </div>
                            )
                            : (
                                <div className={classes.author}>
                                    Author: <span>{blogDetails?.authorId?.username}</span>
                                </div>
                            )
                    }
                </div>
                <div className={classes.row}>
                    <div className={classes.category}>
                        Category:
                        <span>{blogDetails?.category}</span>
                    </div>
                    <div className={classes.right}>
                        {blogLikes} {" "} {isLiked ? <AiFillLike size={20} onClick={handleLike} /> : <AiOutlineLike size={20} onClick={handleLike} />}
                    </div>
                </div>
                <div className={classes.row}>
                    <p>{blogDetails?.desc}</p>
                    <span>Posted: <span>{format(blogDetails?.createdAt)}</span></span>
                </div>
                <div className={classes.commentSection}>
                    <div className={classes.commentInput}>
                        <Image src={person} width='45' height='45' alt="" />
                        <input value={commentText} type="text" placeholder='Type message...' onChange={(e) => setCommentText(e.target.value)}/>
                        <button onClick={handleComment}>Post</button>
                    </div>
                    <div className={classes.comments}>
                        {
                            comments?.length > 0
                            ? comments.map((comment) => (
                                <Comment key={comment._id} comment={comment} setComments={setComments}/>
                            ))
                            : <h4 className={classes.noComments}>No comments. Be the first one to leave a comment!</h4>
                        }
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    )
}

export default BlogDetails