// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]



use std::fs::File;
use std::fs;
use image::{DynamicImage, GenericImageView, ImageFormat};
use image::imageops::FilterType;
use nfd::Response;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[tauri::command]
fn validate_license(license: String) -> bool {
    let contents = fs::read_to_string("../src-tauri/src/license")
        .expect("Should have been able to read the file");

    if contents == ""{
        let res = check_license(license.as_str().clone());
        if res == true{
            fs::write("../src-tauri/src/license", license).expect("Unable To Write!");
            return true;
        }else {
            return false;
        }
    }else{
        return check_license(contents.as_str().clone());
    }
}
fn check_license(license_key: &str)->bool{
    let components: Vec<&str> = license_key.split('-').collect();

    if components.len() != 3 {
        return false;
    }

    let first_three: i32 = components[0].parse().unwrap_or_default();
    let last_seven: &str = components[1];
    let checksum: i32 = components[2].parse().unwrap_or_default();

    if [333, 444, 555, 666, 777, 888, 999].contains(&first_three) {
        return false;
    }

    let total: i32 = last_seven.chars().map(|c| c.to_digit(10).unwrap_or_default() as i32).sum();

    total % 7 == checksum
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
        .invoke_handler(tauri::generate_handler![validate_license, load_file, resize])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
