import mongoose from 'mongoose'

const CampaignSchema=new mongoose.Schema({
  name:{type:String,required:true},
  

  finishedMembers:[{type:mongoose.Schema.Types.ObjectId,required:false,ref:"User"}],
  message:{type:String,required:true},

  createdBy:{type:mongoose.Schema.Types.ObjectId,required:true,ref:"User"},

  pendingMembers:[{type:mongoose.Schema.Types.ObjectId,required:false,ref:"User"}],



  

},{timestamps:true})

export const Campaign=mongoose.models?.Campaign || mongoose.model("Campaign",CampaignSchema);
