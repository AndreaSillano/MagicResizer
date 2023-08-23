import {useEffect, useState} from "react";
import { Icon } from '@iconify/react';
import chainIcon from '@iconify/icons-system-uicons/chain';
import chainBroken from '@iconify/icons-fa/chain-broken';
import rotateRight from '@iconify/icons-vaadin/rotate-right';
import loadingTwotoneLoop from '@iconify/icons-line-md/loading-twotone-loop';
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import {Button, Dropdown, Form, FormSelect} from "react-bootstrap";
import trashIcon from '@iconify/icons-lucide/trash';
import flipH from '@iconify/icons-gis/flip-h';
import flipV from '@iconify/icons-gis/flip-v';
import { readBinaryFile, BaseDirectory } from '@tauri-apps/api/fs';

function App() {
  const [text, setBtnText] = useState("Load Image");
  const [err, setError] = useState("");
  const [file, setFile] = useState(false);
  const [dimension_x, setDimension_x] = useState(0);
  const [dimension_y, setDimension_y] = useState(0);
  const [path, setPath] = useState("");
  const [lockDim, setLockDim] = useState(true);
  const [format, setFormat]= useState("0");
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [proportion, setProportion] = useState(0.0);
  const [bulk, setBulk] = useState(false);
  const [pathBulk,setPathBulk] = useState([]);
  const [nameBulk,setNameBulk] = useState([]);
  const [flipHor, setFlipH] = useState(false);
  const [flipVer, setFlipV] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        if (!bulk){
            if(file){
                loadImage();
            }
        }


    }, [file]);

    const loadImage = async () => {
        try {
            const response = await readBinaryFile(path)
            const imageData = new Uint8Array(response);
            const blob = new Blob([imageData], { type: 'image/jpeg' });
            const imageUrl = URL.createObjectURL(blob);
            setImageUrl(imageUrl);
        } catch (error) {
            console.error('Error loading image:', error);
        }
    };

    async function submit_resize(){
      setFile(false);
      setLoading(true);
      if (dimension_x && dimension_y){
        await invoke("resize", {path: path, exact: lockDim, format: format, rotation: String(rotation), dimx: String(dimension_x), dimy: String(dimension_y), flipv: flipVer, fliph: flipHor  });
      }
      setLoading(false);
      await delete_file();
  }
    async function submit_resize_bulk(){
        setFile(false);
        setLoading(true);
        if (dimension_x && dimension_y){
            await invoke("resize_bulk", {path: pathBulk, exact: lockDim, format: format, rotation: String(rotation), dimx: String(dimension_x), dimy: String(dimension_y),flipv: flipVer, fliph: flipHor });
        }
        setLoading(false);
        await delete_file();

    }
  async function handle_new_dim_x(e){

      if(lockDim === true){
          setDimension_x(e.target.value);
          if(proportion !== 0.0){
              setDimension_y(parseInt(String(e.target.value*proportion)));
          }else {
              setDimension_y(e.target.value);
          }

      }else{
          setDimension_x(e.target.value);
      }

  }
    async function handle_new_dim_y(e){
        if(lockDim === true){
            setDimension_y(e.target.value);
            if(proportion !== 0.0){
                setDimension_x(parseInt(String(e.target.value*(1/proportion))));
            }else {
                setDimension_x(e.target.value);
            }


        }else{
            setDimension_y(e.target.value);
        }
    }
  async function delete_file(){

      setError(false);
    setDimension_y(undefined);
    setDimension_x(undefined);
    setFile(false);
    setPath("");
    setBtnText("Load Image");
    setRotation(0);
      setLoading(false);
      setProportion(0.0);
      setNameBulk([]);
      setPathBulk([]);
      setFlipV(false);
      setFlipH(false);
      setImageUrl("");
  }
    async function load_file() {
        // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
        //setGreetMsg(await invoke("compute_file_dimensions", { file }));
        try{
            setLoading(true);
            let [name,dim,path] = await invoke("load_file")
            if (name !== "")
            {

                setBtnText(name);
                setError(false);
                setPath(path);
                setFile(true);
                setDimension_x(dim[0]);
                setDimension_y(dim[1]);
                setProportion( parseFloat(dim[1])/parseFloat(dim[0]));
                setLoading(false);


            }else{
                setLoading(false);
                setFile(false);
                setError(true);
            }
        }catch (e){
            console.log(e);
        }
    }

    async function load_file_bulk() {
        // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
        //setGreetMsg(await invoke("compute_file_dimensions", { file }));
        try{
            setLoading(true);
            let [name,path] = await invoke("load_file_bulk")
            if (name.length !== 0)
            {
                setError(false);
                const uniquePath = path.filter(element => !pathBulk.includes(element));
                setPathBulk([...pathBulk, ...uniquePath]);
                const uniqueName = name.filter(element => !nameBulk.includes(element));
                setNameBulk([...nameBulk, ...uniqueName]);
                setFile(true);
                setLoading(false);

            }else{
                setLoading(false);
                setFile(false);
                setError(true);
                setNameBulk([]);
                setPathBulk([]);
            }
        }catch (e){
            console.log(e);
        }
    }
    function handleChangeLock() {
      if(lockDim === false){
          if(proportion !== 0.0){
              setDimension_y(parseInt(String(dimension_x*proportion)));
          }else {
              setDimension_y(dimension_x);
          }
      }
        setLockDim(!lockDim);
    }

    function handle_format(e) {
      setFormat(e.target.value);
    }


    function handle_rotation_right() {
      if (rotation>3){
        setRotation(0);
      }else{
          setRotation((prevState)=>prevState+1);
      }

    }

    function handle_delete_image(index) {
        const newArrayName = nameBulk.filter((_, i) => i !== index);
        setNameBulk(newArrayName);
        const newArrayPath = pathBulk.filter((_, i) => i !== index);
        setPathBulk(newArrayPath);
        if (newArrayPath.length === 0){
            setFile(false);
        }
    }

    function handle_bulk_mode() {
        setBulk(!bulk);
    }

    function handle_flip_H() {
        setFlipH(!flipHor);
    }

    function handle_flip_V() {
        setFlipV(!flipVer);
    }

    return (
        <>
        <div className="container">
            {bulk ?<>

                    {loading ? <div className="mb-3"><Icon icon={loadingTwotoneLoop} width={100} color="#0F9D58"/> </div>:
                        <>
                            <div className="row">
                                <h1>Welcome to Magic Resizer!</h1>
                                <p>Bulk Mode</p>
                            </div>

                            <div className="row">
                                <img src="/logo.png" className="logo" alt="logo" />
                            </div>
                            <div className="mb-3">

                                <div className="row">
                                    <Button className="button-44-up-bulk" role="button" onClick={load_file_bulk}>Load Bulk Images</Button>
                                    {file && <Button className="button-44" role="button" onClick={delete_file}>X</Button>}
                                </div>
                                {!file &&
                                    <>
                                     <h3>Bulk Mode</h3>
                                    <label className="switch">
                                    <input type="checkbox" defaultChecked={bulk} onClick={handle_bulk_mode}/>
                                    <span className="slider round">
                                    </span>
                                </label></>}
                            </div>

                            {file && <><h2>Files</h2>
                            <div className="mb-3">
                                <div className="row">
                                     <div className="scrollable-view">
                            <ul>
                                {nameBulk.map((element, index) => (
                                    <li key={index}>{element} <Icon className="trash" icon={trashIcon} color="#db4437" width={20} onClick={()=>{handle_delete_image(index);}}/>  </li>
                                ))}
                            </ul>
                                    </div>
                                    </div>
                            </div></>}

                            <div className="mb-3">
                                {file&&<p>Insert New Dimensions</p>}
                                {file && <><label >X: <input className="dim-input" type="number" id="dim_x" min ="0" value={dimension_x} onChange={handle_new_dim_x} /></label>
                                    {lockDim ? <Icon className="chain_btn" icon={chainIcon} width={25} onClick={handleChangeLock}/>:<Icon className="chain_btn" icon={chainBroken} onClick={handleChangeLock} />}
                                    <label className="label-dim">Y: <input className="dim-input" type="number" id="dim_y" min ="0" value={dimension_y} onChange={handle_new_dim_y}/></label></>}
                            </div>
                            <div className="mb-3">
                                <div className="row">
                                    {file &&<p className="action_label"> Rotation 90°</p>}
                                    {file && <p className="action_label">Flip Horizontal</p>}
                                    {file && <p className="action_label">Flip Vertical</p>}

                                </div>
                                <div className="row">
                                    {file && <><Icon icon={rotateRight} className="rotate_icon_right" width={30} onClick={handle_rotation_right} rotate={rotation-1}/></>}

                                    {file && <Icon className="flip_icon_right" icon={flipH} hFlip={!flipHor} width={30} onClick={handle_flip_H}/>}
                                    {file && <Icon className="flip_icon_right" icon={flipV} vFlip={flipVer} width={30} onClick={handle_flip_V}/>}

                                </div>

                            </div>

                            {file && <p>Click Resize to save a new Images</p>}
                            {err && <h4  className="error" >Invalid File Format</h4>}
                            <form
                                className="row"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    submit_resize_bulk();
                                }}
                            >
                                { file && <> <button className="submitBtn" type="submit">Resize</button>

                                    <div className="select">
                                        <select onChange={handle_format}>
                                            <option value="0">Png</option>
                                            <option value="1">Jpeg</option>
                                            <option value="2">Tiff</option>
                                            <option value="3">Gif</option>
                                        </select>
                                    </div>
                                </>}


                            </form>
                        </>

                    }
                </>

                : <>{loading ?  <div className="mb-3"><Icon icon={loadingTwotoneLoop} width={100} color="#0F9D58"/> </div>: <>
                  <h1>Welcome to Magic Resizer!</h1>
                  <div className="row ">
                      {file ?
                          <img src={imageUrl} className="image_loaded" alt="image could not be previewed"  style={{ transform: `rotate(${rotation*90}deg) scaleX(${flipHor ? -1 : 1}) scaleY(${flipVer ? -1 : 1})`}}/>
                          :
                          <img src="/logo.png" className="logo" alt="logo" />}
                    </div>
                    {file && <p>{text}</p>}
                    <div className="mb-3">
                        <div className="row">
                            <Button className="button-44-up" role="button" onClick={load_file} disabled={file}>Load Image</Button>
                            {file && <Button className="button-44" role="button" onClick={delete_file}>X</Button>}
                        </div>
                        {!file &&
                            <>
                                <h3>Single Mode</h3>
                                <label className="switch">
                                    <input type="checkbox"  onClick={handle_bulk_mode}/>
                                    <span className="slider round" >
                                    </span>
                                </label></>}
                    </div>

                    <div className="mb-3">
                        {file&&<p>Insert New Dimensions</p>}
                            {file && <><label >X: <input className="dim-input" type="number" id="dim_x" min ="0" value={dimension_x} onChange={handle_new_dim_x} /></label>
                                {lockDim ? <Icon className="chain_btn" icon={chainIcon} width={25} onClick={handleChangeLock}/>:<Icon className="chain_btn" icon={chainBroken} onClick={handleChangeLock} />}
                                <label className="label-dim">Y: <input className="dim-input" type="number" id="dim_y" min ="0" value={dimension_y} onChange={handle_new_dim_y}/></label></>}
                    </div>
                    <div className="mb-3">
                        <div className="row">
                            {file &&<p className="action_label"> Rotation 90°</p>}
                            {file && <p className="action_label">Flip Horizontal</p>}
                            {file && <p className="action_label">Flip Vertical</p>}

                        </div>
                        <div className="row">
                        {file && <><Icon icon={rotateRight} className="rotate_icon_right" width={30} onClick={handle_rotation_right} rotate={rotation-1}/></>}

                        {file && <Icon className="flip_icon_right" icon={flipH} hFlip={!flipHor} width={30} onClick={handle_flip_H}/>}
                            {file && <Icon className="flip_icon_right" icon={flipV} vFlip={flipVer} width={30} onClick={handle_flip_V}/>}

                        </div>

                    </div>

                    {file && <p>Click Resize to save a new Image</p>}
                    {err && <h4  className="error" >Invalid File Format</h4>}
                  <form
                    className="row"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submit_resize();
                    }}
                  >
                      { file && <> <button type="submit" className="submitBtn">Resize</button>

                          <div className="select">
                              <select onChange={handle_format}>
                                  <option value="0">Png</option>
                                  <option value="1">Jpeg</option>
                                  <option value="2">Tiff</option>
                                  <option value="3">Gif</option>
                              </select>
                          </div>
                      </>}


      </form>
            </>}</>}

    </div>
            <footer>
                    <p>Developed By Andrea Sillano -  v 0.0.3</p>
            </footer></>
  );
}


export default App;
