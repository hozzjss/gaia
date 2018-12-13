/* @flow */

export function getDriverClass(driver: string) {
  if (driver === 'aws') {
    return require('./drivers/S3Driver')
  } else if (driver === 'azure') {
    return require('./drivers/AzDriver')
  } else if (driver === 'disk') {
    return require('./drivers/diskDriver')
  } else if (driver === 'google-cloud') {
    return require('./drivers/GcDriver')
  } else {
    throw new Error(`Failed to load driver: driver was set to ${driver}`)
  }
}


export function readStream(stream: readable, size: number): Promise<Buffer> {
  const outBuffer = Buffer.alloc(size)
  let bufferIndex = 0
  let finished = false

  return new Promise((accept, reject) => {
    stream.on('data', (chunk) => {
      if (!Buffer.isBuffer(chunk)) {
        finished = true
        stream.destroy()
        return reject(new Error('Stream must be passed without encoding set'))
      }
      const chunkLength = chunk.length
      if (bufferIndex + chunkLength > size) {
        finished = true
        stream.destroy()
        return reject(new Error('Too much data in stream or incorrect size passed to readStream()'))
      }
      chunk.copy(outBuffer, bufferIndex)
      bufferIndex += chunkLength
    })

    stream.on('end', () => {
      if (!finished) {
        finished = true
        return accept(outBuffer)
      }
    })

    stream.on('error', (err) => {
      if (!finished) {
        finished = true
        return reject(err)
      }
    })

    stream.on('close', () => {
      if (!finished) {
        finished = true
        return reject(new Error('Stream closed, unexpectedly.'))
      }
    })
  })
}