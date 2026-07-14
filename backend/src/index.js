// src/index.js
const mongoose = require('mongoose')
const config = require('./utils/config')
const app = require('./app') // 先环境配置，再 app
const logger = require('./utils/logger')

async function start() {
  try {
    // 连接到 MongoDB
    logger.info('connecting to', config.MONGODB_URI)
    await mongoose.connect(config.MONGODB_URI, { family: 4 })
    logger.info('connected to MongoDB')

    const PORT = config.PORT || 3001

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
    })

  } catch (err) {
    logger.error('error connecting to MongoDB:', err.message)
    process.exit(1)
  }
}

start()

