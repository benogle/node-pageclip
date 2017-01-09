'use strict'

const _ = require('lodash')
const Base64 = require('js-base64').Base64
const promisify = require('es6-promisify')
const request = promisify(require('request'), {multiArgs: true})
const clientVersion = require('../package.json').version

const DefaultOptions = {baseURL: 'https://datacastle.com'}

class DataCastle {
  constructor (token, options) {
    this._token = validateToken(token)
    this._base64Token = Base64.encode(`${token}:`)
    this._options = Object.assign({}, DefaultOptions, options)
  }

  // Returns all items
  get (bucketName) {
    bucketName = this._getBucketName(bucketName)
    return this._request('GET', `/api/data/${bucketName}`)
  }

  // Send data
  send (bucketName, data) {
    if (_.isObject(bucketName) && data === undefined) {
      data = bucketName
      bucketName = null
    }
    bucketName = this._getBucketName(bucketName)
    return this._request('PUT', `/api/data/${bucketName}`, data)
  }

  _getBucketName (bucketName) {
    bucketName = (bucketName || 'default').trim()
    return validateBucketName(bucketName)
  }

  _request (method, url, args) {
    let options = this._getRequestOptions(method, url, args)
    return request(options).then((result) => {
      let message = result[0]
      let response = result[1]
      response.status = message.statusCode
      return response
    })
  }

  _getRequestOptions (method, url, body) {
    return {
      url,
      body,
      method,
      json: true,
      baseUrl: this._options.baseURL,
      headers: this._getHeaders()
    }
  }

  _getHeaders () {
    return {
      'X-REQMETHOD': 'api-client',
      'X-REQTRANSPORT': 'api-client',
      'Accept': 'application/json',
      'User-Agent': `datacastle.js v${clientVersion}`,
      'Content-Type': 'application/json',
      'Authorization': `Basic ${this._base64Token}`
    }
  }
}

const APIKeyRegex = /^[a-z0-9]{32}$/i
function validateToken (token) {
  if (!APIKeyRegex.test(token)) throw new Error('API token not valid!')
  return token
}

const BucketNameRegex = /^[a-z]\w*$/i
function validateBucketName (bucketName) {
  if (!BucketNameRegex.test(bucketName)) throw new Error('Bucket names are only word characters!')
  return bucketName
}

module.exports = DataCastle
