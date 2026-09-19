import { Link } from "react-router-dom";
import logo from "../imgs/logo.png";
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import { uploadImage } from "../common/aws";
import { useContext, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import { useEffect } from "react";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";

// <--------------------  Blog BannerImage functions ------------------------>
const BlogEditor = () => {

    let blogBannerRef = useRef();
    let { blog, blog: { title, banner, content, tags, des }, setBlog, textEditor, setTextEditor, setEditorState } = useContext(EditorContext)

    // react hook ->  useEffect
    useEffect(() => {
        const editor = new EditorJS({
            holderId: "textEditor",
            data: content,
            tools: tools,
            placeholder:"Start you story here"
        })

        setTextEditor(editor)

        return () => editor.destroy()
    }, [])

    const handleBannerUpload = (e) => {

        let img = e.target.files[0];
        
        if(img){

            let loadingToast = toast.loading("Uploading.....")

            uploadImage(img).then((url) => {
                if(url){
                    toast.dismiss(loadingToast);
                    toast.success("Uploaded👍");
                    setBlog({ ...blog, banner: url })
                   
                }
            })
            .catch(err => {
                toast.dismiss(loadingToast);
                return toast.error(err);
            })
        }

    }
// <--------------------  Blog Text area functions ------------------------>
    const handleTitleKeyDown = (e) => {
        if(e.keyCode == 13){  // user pressed enter aur hume nahi chahiye title me enter ho 
            e.preventDefault();
        }
    }

    const handleTitleChange = (e) => {

        let input = e.target;
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + "px";

        setBlog({ ...blog, title:input.value })
    }

    const handleError = (e) => {
        let img = e.target;

        img.src = defaultBanner;

    }

    // editor to publish form state  button 
    const handlePublishEvent = () => {
        
        if(!banner.length){
            return toast.error("upload a banner image to publish your Blog")
        }
        if(!title.length){
            return toast.error("Write Blog title to publish your Blog")
        }
        if(textEditor.isReady){
            textEditor.isReady.then(() => textEditor.save()).then(data => {        // .save promise is to store data
                if(data.blocks.length){
                    setBlog({ ...blog, content: data });  // destructured blog 
                    setEditorState("publish")
                }
                else{
                    return toast.error("Write something in the blog content to publish your Blog")
                }
            })
            .catch((err) => {
                console.log(err);
            })
        }

    }

    return(
        <>
            <Toaster />
            <nav className = "navbar">
            <Link to="/" className = "flex-none w-10">
                <img src={logo} />
            </Link>
            <p className = "max-md:hidden text-black line-clamp w-full ">
                {title.length ? title : "New Blog"}
            </p>

            <div className = "flex gap-4 ml-auto">
                <button className="btn-dark py-2 "
                    onClick={handlePublishEvent}
                >
                    Publish
                </button>

                <button className="btn-light py-2 ">
                    Save Draft
                </button>

            </div>
            </nav>
{/* -------------------- BLOG BANNER IMAGE AREA ------------------ */}
            <AnimationWrapper>
                <section>
                    <div className ="mx-auto max-w-[900px] w-full">

                        <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey">

                            <label htmlForm="uploadBanner">
                                <img
                                    //ref = {blogBannerRef}
                                    src = {banner}
                                    className="Z-20"
                                    onError = {handleError}

                                />
                                <input 
                                    id="uploadBanner"
                                    type="file"
                                    accept=".png, .jpg, .jpeg"
                                    hidden
                                    onChange={handleBannerUpload}
                                />
                            </label>

                        </div>

    {/* -------------------- BLOG TEXT AREA ------------------ */}
                        <textarea
                            default value = {title}
                            placeholder = "Blog Title"
                            className = "text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40 "
                            onKeyDown={handleTitleKeyDown}
                            onChange={handleTitleChange}
                        >
                        </textarea>

                        <hr className="w-full opacity-10 my-5" />

    {/* -------------------- BLOG TEXT EDITOR AREA ------------------ */}
                        <div id="textEditor" className="font-gelasio"></div> 
                        {/* yaha pe hum library use karenge "Editor.js" . Jisko use karke hum Text Editor easily create karenge. */}

                    </div>
                </section>
            </AnimationWrapper>

        </>
    )
}

export default BlogEditor;