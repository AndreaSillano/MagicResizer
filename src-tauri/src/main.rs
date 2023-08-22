// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]



use std::fs::File;
use image::{DynamicImage, GenericImageView, ImageFormat};
use image::imageops::FilterType;
use nfd::Response;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
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
fn resize(path: String, exact: bool, format: String)->bool {
    let split_res:Vec<_> = path.split("-").collect();
    let img = image::open(split_res[0]).unwrap();

    let x = split_res[1].parse::<i32>().unwrap();
    let y = split_res[2].parse::<i32>().unwrap();
    let mut new_img = img.clone();
    if exact == true {
        new_img = img.resize(x as u32, y as u32, FilterType::Lanczos3);
    }else{
        new_img = img.resize_exact(x as u32, y as u32, FilterType::Lanczos3);
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
fn handle_png(path: String, new_img: DynamicImage){
    let mut output = File::create(path+".png").unwrap();
    new_img.write_to(&mut output, ImageFormat::Png).unwrap()
}
fn handle_jpg(path: String, new_img: DynamicImage){
    let mut output = File::create(path+".jpeg").unwrap();
    new_img.write_to(&mut output, ImageFormat::Jpeg).unwrap()
}
fn handle_tiff(path: String, new_img: DynamicImage){
    let mut output = File::create(path+".tiff").unwrap();
    new_img.write_to(&mut output, ImageFormat::Tiff).unwrap()
}
fn handle_gif(path: String, new_img: DynamicImage){
    let mut output = File::create(path+".gif").unwrap();
    new_img.write_to(&mut output, ImageFormat::Gif).unwrap()
}

fn main() {

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, load_file, resize])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
