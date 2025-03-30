import mongoose from 'mongoose'


const userSchema=new mongoose.Schema({
  name:{type:String,required:true},
 
  email:{type:String,required:true},



 

  

 
  role:{type:String,default:'refferer'},


  campaigns:[{type:mongoose.Schema.Types.ObjectId,required:false,ref:"Campaign"}],
  

},{timestamps:true})

export const User=mongoose.models?.User || mongoose.model("User",userSchema);