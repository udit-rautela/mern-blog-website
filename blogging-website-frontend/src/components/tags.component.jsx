import { useContext } from "react";
import { EditorContext } from "../pages/editor.pages";

const Tag = ({ tag, tagIndex }) => {

    let {blog,blog:{tags}, setBlog} = useContext(EditorContext);

    const addEditable = (e) => {
        e.target.setAttribute("contenteditable", true); // to make the tag editable when user clicks on it
        e.target.focus();
    }

    const handleTagEdit = (e) => {
        if(e.keyCode == 13 || e.keyCode == 188){
            e.preventDefault();
            let currentTag = e.target.innerText;

            tag[tagIndex] = currentTag;
            setBlog({...blog, tags: [...tags] });
            
            e.target.setAttribute("contenteditable", false); // to make the tag non-editable after user presses enter or comma
        }
    }

    const handleTagDelete = () => {

        tags = tags.filter(t => t !== tag);
        setBlog({...blog, tags: blog.tags.filter(t => t !== tag) });
    }

    return (
        <div className ="relative p-2 mt-2 mr-2 px-5 bg-white rounded-full inline-block hover: bg-opacity-50 pr-10">
            <p className="ouline-none" 
               onKeyDown = {handleTagEdit}
               onClick={addEditable}
            >
                { tag }
            </p>

            <button className = "mt-[2px] rounded-full absolute right-3 top-1/2 -translate-y-1/2 "
            
                onClick={handleTagDelete}
            >
                <i className="fi fi-br-cross text-xl pointer-events-none"></i> 
            </button>

        </div>
    )
}

export default Tag;