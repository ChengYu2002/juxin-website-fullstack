const mongoose = require('mongoose')

const inquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 120
    },
    email: {
      type: String,
      required: true,
      match: /^\S+@\S+\.\S+$/,
      trim: true,
      lowercase: true,
      maxLength: 200
    },
    message: {
      type: String,
      required: true,
      maxLength: 5000
    },
    ip: {
      type: String,
      required: true
    },
    emailed: {
      type: String,
      default: 'pending',
      enum: ['pending', 'sent', 'failed'],
    },
    country: { type: String, maxLength: 80 },
    region: { type: String, maxLength: 120 },

    // 询盘处理状态：new / done
    status: {
      type: String,
      enum: ['new', 'done'],
      default: 'new',
    },
  },
  { timestamps: true }
)

// 转换输出格式：_id -> id，去掉 __v; 不影响数据库里真实存储的数据
inquirySchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

module.exports = mongoose.model('Inquiry', inquirySchema)
