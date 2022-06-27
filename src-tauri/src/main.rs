#![feature(proc_macro_hygiene)]
#![feature(async_closure)]
#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
use futures::stream::StreamExt;
use tokio::io::AsyncWriteExt;
use std::{env, io, str, path::{self, Path}};

use tokio_util::codec::{Decoder, Encoder};
use bytes::BytesMut;
use tokio_serial::SerialPortBuilderExt;
use tokio::fs::File;
use std::io::prelude::*;
#[cfg(windows)]
const DEFAULT_TTY: &str = "COM3";
struct LineCodec;

impl Decoder for LineCodec {
    type Item = String;
    type Error = io::Error;

    fn decode(&mut self, src: &mut BytesMut) -> Result<Option<Self::Item>, Self::Error> {
        let newline = src.as_ref().iter().position(|b| *b == b'\n');
        if let Some(n) = newline {
            let line = src.split_to(n + 1);
            return match str::from_utf8(line.as_ref()) {
                Ok(s) => Ok(Some(s.to_string())),
                Err(_) => Err(io::Error::new(io::ErrorKind::Other, "Invalid String")),
            };
        }
        Ok(None)
    }
}

impl Encoder<String> for LineCodec {
    type Error = io::Error;

    fn encode(&mut self, _item: String, _dst: &mut BytesMut) -> Result<(), Self::Error> {
        Ok(())
    }
}
extern crate dirs;
#[tokio::main]
async fn main() -> tokio_serial::Result<()>{
  //let mut file = File::create("foo.txt")?;
  let path = Path::new(&dirs::config_dir().unwrap()).join("sporadic");
  std::fs::create_dir_all(path)?;
  #[tauri::command]
  async fn update_txt(js_msg: String) {
    let path = Path::new(&dirs::config_dir().unwrap()).join("sporadic").join("smth.txt");
    println!("{:?}", &path);
    let mut file = tokio::fs::OpenOptions::new()
        .write(true)
        .create_new(false)
        .append(true)
        .open(path)
        .await.unwrap();
    file.write_all(js_msg.as_bytes()).await.expect("No");
    println!("{}", js_msg);
     // I'm Rust!
  }
  #[tauri::command]
  async fn update_coord(js_msg: String) {
    let path = Path::new(&dirs::config_dir().unwrap()).join("sporadic").join("data").join("smth.txt");
    println!("{:?}", &path);
    let mut file = tokio::fs::OpenOptions::new()
        .write(true)
        .create_new(false)
        .append(true)
        .open(path)
        .await.unwrap();
    file.write_all(js_msg.as_bytes()).await.expect("No");
    println!("{}", js_msg);
     // I'm Rust!
  }
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![update_txt, update_coord])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
  Ok(())
}
