import axios from "axios";

export const uploadImage = async (img) => {
    const serverDomain = import.meta.env.VITE_SERVER_DOMAIN || "http://localhost:3000";
    const { data: { uploadURL } } = await axios.get(`${serverDomain}/get-upload-url`, {
        params: { contentType: img.type }
    });

    await axios.put(uploadURL, img, {
        headers: { "Content-Type": img.type }
    });

    return uploadURL.split("?")[0];

}
