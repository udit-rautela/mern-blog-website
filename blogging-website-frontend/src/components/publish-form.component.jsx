import { useContext } from "react";
import AnimationWrapper from "../common/page-animation";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import Tag from "./tags.component";
import { UserContext } from "../App";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SERVER_DOMAIN = import.meta.env.VITE_SERVER_DOMAIN || "http://localhost:3000";

const PublishForm = () => {

  let characterLimit = 200;
  let tagLimit = 10;

  let {blog, blog: { banner, title, tags, des, content }, setEditorState, setBlog } = useContext(EditorContext);

  let { userAuth: { access_token } } = useContext(UserContext);
  // for redirecting user to another page after publishing the blog
  let navigate = useNavigate();

  const handleCloseEvent = () => {
    setEditorState("editor")
  }

  const handleBlogTitleChange = (e) => {
    let input = e.target;

    setBlog({...blog, title: input.value })
  }
  const handleBlogDesChange = (e) => {
    let input = e.target;
    setBlog({...blog, des: input.value })
  }

  const handleTitleKeyDown = (e) => {
        if(e.keyCode == 13){  // user pressed enter aur hume nahi chahiye title me enter ho 
            e.preventDefault();
        }
    }

  const handleKeyDown = (e) => {
    if(e.keyCode == 13 || e.keyCode == 188){  
        e.preventDefault();

        let tag = e.target.value;

        if(tags.length < tagLimit){
            if(!tags.includes(tag) && tag.length > 0){
                setBlog({...blog, tags: [...tags, tag] });
                toast.success("Tag added successfully")
            }
        }else{
          toast.error(`You can add only ${tagLimit} tags`)
        }

        e.target.value = "";

    }
  }

  const publishBlog = (e) => {

    if(e.target.className.includes('disable')){
      return;
    }

    if(!title.length){
      return toast.error("Blog title required to publish the blog");
    }

    if(!des.length || des.length > characterLimit){
      return toast.error(`Blog description required to publish the blog and it should be less than ${characterLimit} characters`);
    }

    if(!tags.length || tags.length > tagLimit){
      return toast.error(`Blog tags required to publish the blog and it should be less than ${tagLimit} tags`);
    }

    let loadingToast = toast.loading("Publishing.....");

    e.target.classList.add('disable');

    let blogObj = {
      title, content, banner, des, tags, draft: false
    }

    axios.post(`${SERVER_DOMAIN}/create-blog`, blogObj, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    }) 
    .then(() => {
       e.target.classList.remove('disable');
       toast.dismiss(loadingToast);
       toast.success("Blog published successfully");
       setTimeout(() => {
        navigate("/");
       },500);

       
    })
    .catch((error) => {
      e.target.classList.remove('disable');
      toast.dismiss(loadingToast);
      return toast.error(error.response?.data?.error || error.message || "Unable to publish the blog")
    })

  }

  return (
    <AnimationWrapper>
      <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4">

        <Toaster/>

        <button className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]"
          onClick={ handleCloseEvent}
        >
          <i className="fi fi-br-cross"></i>
        </button>

        <div className="max-w-[550px] center">

          <p className="txt-dark-grey mb-1">Preview</p>

          <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
            <img src={banner} />
          </div>

        <h1 className="text-4xl font-medium mt-2 leading-tight line-clamp-2">{title}</h1>

        <p className="font-gelasio line-clamp-2 text-xl leading-7 mt-4">{ des }</p>

        </div>

        <div className=" border-grey lg:border-1 lg:pl-8 "> 

          <p className="text-dark-grey mb-2 mt-9">Blog Title</p>
          <input type="text" placeholder="Blog Title" defaultValue={title}   className="input-box pl-4"
            onChange={ handleBlogTitleChange }/>

          <p className="text-dark-grey mb-2 mt-9">Short Description about the Blog</p>
            <textarea maxlength = {characterLimit} 
                  defaultValue={des} 
                  className="h-40 resize-none leading-7 input-box pl-4 pt-2"
                  onChange={handleBlogDesChange}
                  onKeyDown={handleTitleKeyDown}
            >

          </textarea>

          <p className="text-dark-grey text-sm text-right mt-1"> 
            { characterLimit - des.length } characters remaining
          </p>

          <p className="text-dark-grey mb-2 mt-9">
            Topics - (Helps in searching and ranking your blog)
          </p>

          <div className="relative input-box pl-2 py-2 pb-4">
            <input type="text" placeholder="topics" 
                   className="sticky input-box bg-white top-0 left-0 mb-3 pl-4 focus: bg-white" 
            
                   onKeyDown = {handleKeyDown}
            />
            
            { tags.map((tag, i) => {
                return <Tag key={i} tagIndex={i} tag={tag} />
            })}

          </div>

          <button className="btn-dark px-8 mt-14"
            onClick = {publishBlog}

          >
            Publish
          </button>

        </div>

      </section>
    </AnimationWrapper> 
  )
}

export default PublishForm;