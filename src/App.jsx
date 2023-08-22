import { useState } from "react";
import { Icon } from '@iconify/react';
import chainIcon from '@iconify/icons-system-uicons/chain';
import chainBroken from '@iconify/icons-fa/chain-broken';
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import {Button, Dropdown, Form, FormSelect} from "react-bootstrap";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [text, setBtnText] = useState("Load Image");
  const [err, setError] = useState("");
  const [file, setFile] = useState(false);
  const [dimension_x, setDimension_x] = useState(undefined);
  const [dimension_y, setDimension_y] = useState(undefined);
  const [path, setPath] = useState(false);
  const [lockDim, setLockDim] = useState(true);
  const [format, setFormat]= useState("0");
  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    //setGreetMsg(await invoke("greet", { name }));
  }
  async function submit_resize(){

      await invoke("resize", {path: path+"-"+dimension_x+"-"+dimension_y, exact: lockDim, format: format});
      await delete_file();
  }
  async function handle_new_dim_x(e){

      if(lockDim === true){
          console.log(lockDim);
          setDimension_x(e.target.value);
          setDimension_y(e.target.value);
      }else{
          setDimension_x(e.target.value);
      }

  }
    async function handle_new_dim_y(e){
        if(lockDim === true){
            setDimension_y(e.target.value);
            setDimension_x(e.target.value);

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
  }
    async function load_file() {
        // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
        //setGreetMsg(await invoke("compute_file_dimensions", { file }));
        try{
            let [name,dim,path] = await invoke("load_file")
            if (name !== "")
            {
                setBtnText(name);
                setError(false);
                setPath(path);
                setFile(true);
                setDimension_x(dim[0]);
                setDimension_y(dim[1]);
            }else{
                setFile(false);
                setError(true);
            }
        }catch (e){
            console.log(e);
        }

    }

    function handleChangeLock() {
      if(lockDim === false){
          setDimension_y(dimension_x);
      }
        setLockDim(!lockDim);
    }

    function handle_format(e) {
      setFormat(e.target.value);
    }

    return (
    <div className="container">
      <h1>Welcome to Magic Resizer!</h1>

      <div className="row">
          <img src="/logo.png" className="logo" alt="logo" />
      </div>
        <div className="mb-3">
            <div className="row">
                <Button className="button-44-up" role="button" onClick={load_file} disabled={file}>{text}</Button>
                {file && <Button className="button-44" role="button" onClick={delete_file}>X</Button>}
            </div>
        </div>
        <div className="mb-3">
                {file && <><label >X: <input className="dim-input" type="number" id="dim_x" min ="0" value={dimension_x} onChange={handle_new_dim_x} /></label>
                {lockDim ? <Icon className="chain_btn" icon={chainIcon} width={17} onClick={handleChangeLock}/>: <Icon className="chain_btn" icon={chainBroken} onClick={handleChangeLock} />}
                    <label className="label-dim">Y: <input className="dim-input" type="number" id="dim_y" min ="0" value={dimension_y} onChange={handle_new_dim_y}/></label></>}
        </div>
        {file && <p>Click Save to Resize the Image</p>}
        {err && <h4  className="error" >Invalid File Format</h4>}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          submit_resize();
        }}
      >
          { file && <> <button type="submit">Resize</button>

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

    </div>
  );
}


export default App;
