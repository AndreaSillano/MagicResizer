// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]



use std::fs::File;
use std::fs;
use std::io::{Read, Write};
use image::{DynamicImage, GenericImageView, ImageFormat};
use image::imageops::FilterType;
use nfd::Response;
use tauri::api::file;


// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command


#[tauri::command]
fn load_file()-> (String, (u32,u32), String) {
    let result = nfd::dialog().open().unwrap_or_else(|e| {
        panic!("{}",e);
    });

    match result {
        Response::Okay(file_path) => {
            println!("File path = {:?}", file_path);

            let img = image::open(file_path.clone());
            match img {
                Ok(..)=>{
                    let final_img = img.unwrap();
                    let dim = final_img.dimensions();
                    let name_split:Vec<_> = file_path.split("/").collect();
                    //println!("{:?}", name_split[name_split.len()-1]);
                    (name_split[name_split.len()-1].to_string(), (dim.0, dim.1), file_path)
                }
                Err(..)=>{
                    ("".to_string(),(0,0), "".to_string())
                }
            }
        },
        Response::Cancel => {println!("User canceled"); ("".to_string(),(0,0), "".to_string())},
        _ => {("".to_string(), (0,0), "".to_string())}
    }
}
#[tauri::command]
fn load_file_bulk()-> (Vec<String>, Vec<String>) {
    let result = nfd::dialog_multiple().open().unwrap_or_else(|e| {
        panic!("{}",e);
    });

    match result {
        Response::OkayMultiple(files) => {
            let mut path_vec = Vec::new();
            let mut name_vec = Vec::new();
            println!("File path = {:?}", files);
            for path in files.into_iter(){
                let name_split:Vec<_> = path.split("/").collect();
                let img = image::open(path.clone());
                match img {
                    Ok(..)=>{
                        name_vec.push(name_split[name_split.len()-1].to_string());
                        path_vec.push(path.to_string());

                    }
                    Err(..)=>{
                        return (vec![], vec![]);
                    }
                }
            }
            (name_vec, path_vec)
        },

        Response::Cancel => {println!("User canceled"); (vec![], vec![])},
        _ => {(vec![], vec![])}
    }
}
#[tauri::command]
fn resize(path: String, exact: bool, format: String, rotation: String, dimx: String, dimy: String)->bool {
    //let split_res:Vec<_> = path.split("-").collect();
    let img = image::open(path).unwrap();

    let x =dimx.parse::<i32>().unwrap();
    let y = dimy.parse::<i32>().unwrap();
    let mut new_img = img.clone();
    let mut rot = rotation.parse::<i32>().unwrap();
    if rot > 0 {
       for _ in 0..rot{
           new_img = new_img.rotate90();
       }
    }
    if exact == true {
        new_img = new_img.resize(x as u32, y as u32, FilterType::Lanczos3);

    }else{
        new_img = new_img.resize_exact(x as u32, y as u32, FilterType::Lanczos3);
    }
    if let Response::Okay(path) = nfd::dialog_save().open().unwrap_or_else(|e|{panic!("{}",e);}){

        //let mut output = File::create(path).unwrap();
        let format = format.as_str();
        match format {
            "0" =>{handle_png(path, new_img);}
            "1" =>{handle_jpg(path,new_img);}
            "2" =>{handle_tiff(path,new_img);}
            "3" =>{handle_gif(path,new_img);}

            _ => {}
        }

        return true;
    }
    false

}
#[tauri::command]
fn resize_bulk(path: Vec<String>, exact: bool, format: String, rotation: String, dimx: String, dimy: String)->bool {
    //let split_res:Vec<_> = path.split("-").collect();
    println!("{:?}", path);

    if let Response::Okay(dir_path) = nfd::open_pick_folder(None).unwrap_or_else(|e|{panic!("{}", e);}){
        for p in path.clone()  {
            let img = image::open(p.clone()).unwrap();

            let x =dimx.parse::<i32>().unwrap();
            let y = dimy.parse::<i32>().unwrap();
            let mut new_img = img.clone();
            let mut rot = rotation.parse::<i32>().unwrap();
            if rot > 0 {
                for _ in 0..rot{
                    new_img = new_img.rotate90();
                }
            }
            if exact == true {
                new_img = new_img.resize(x as u32, y as u32, FilterType::Lanczos3);

            }else{
                new_img = new_img.resize_exact(x as u32, y as u32, FilterType::Lanczos3);
            }
            let format = format.as_str();
            match format {
                "0" =>{handle_png_bulk(dir_path.clone(), new_img, p.clone());}
                "1" =>{handle_jpg_bulk(dir_path.clone(), new_img, p.clone());}
                "2" =>{handle_tiff_bulk(dir_path.clone(), new_img, p.clone());}
                "3" =>{handle_gif_bulk(dir_path.clone(), new_img, p.clone());}

                _ => {}
            }


        }
        return true;
    }

    false

}
fn remove_extension(file_name: &str) -> String {
    let name_split:Vec<_> = file_name.split("/").collect();
    let name = name_split[name_split.len()-1].to_string();
    let parts: Vec<&str> = name.split('.').collect();
    if parts.len() > 1 {
        parts[0..parts.len() - 1].join(".")
    } else {
        file_name.to_string()
    }
}
fn handle_png_bulk(path: String, new_img: DynamicImage, image_path: String){
    let name = remove_extension(image_path.as_str());
    let dim = new_img.dimensions();
    let full_path = path.clone() + "/" +name.as_str()+dim.0.to_string().as_str() +"x"+ dim.1.to_string().as_str();
    let mut output = File::create(full_path+ ".png").unwrap();
    new_img.write_to(&mut output, ImageFormat::Png).unwrap()
}
fn handle_jpg_bulk(path: String, new_img: DynamicImage,image_path: String){
    let name = remove_extension(image_path.as_str());
    let dim = new_img.dimensions();
    let full_path = path.clone() + "/" +name.as_str()+dim.0.to_string().as_str() +"x"+ dim.1.to_string().as_str();
    let mut output = File::create(full_path+ ".jpeg").unwrap();
    new_img.write_to(&mut output, ImageFormat::Jpeg).unwrap()
}
fn handle_tiff_bulk(path: String, new_img: DynamicImage,image_path: String){
    let name = remove_extension(image_path.as_str());
    let dim = new_img.dimensions();
    let full_path = path.clone() + "/" +name.as_str()+dim.0.to_string().as_str() +"x"+ dim.1.to_string().as_str();
    let mut output = File::create(full_path+ ".tiff").unwrap();
    new_img.write_to(&mut output, ImageFormat::Tiff).unwrap()
}
fn handle_gif_bulk(path: String, new_img: DynamicImage, image_path: String) {
    let name = remove_extension(image_path.as_str());
    let dim = new_img.dimensions();
    let full_path = path.clone() + "/" +name.as_str()+dim.0.to_string().as_str() +"x"+ dim.1.to_string().as_str();
    let mut output = File::create(full_path+ ".gif").unwrap();
    new_img.write_to(&mut output, ImageFormat::Gif).unwrap()
}
fn handle_png(path: String, new_img: DynamicImage){
    //let mut output = File::create(path+".png").unwrap();

    new_img.save_with_format(path.clone()+".png",ImageFormat::Png).unwrap();
    //new_img.write_to(&mut output, ImageFormat::Png).unwrap()
}
fn handle_jpg(path: String, new_img: DynamicImage){
    new_img.save_with_format(path.clone()+".jpeg",ImageFormat::Jpeg).unwrap();
}
fn handle_tiff(path: String, new_img: DynamicImage){
    new_img.save_with_format(path.clone()+".tiff",ImageFormat::Tiff).unwrap();
}
fn handle_gif(path: String, new_img: DynamicImage){
    new_img.save_with_format(path.clone()+".gif",ImageFormat::Gif).unwrap();
}

fn main() {

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![load_file, resize, load_file_bulk,resize_bulk])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
