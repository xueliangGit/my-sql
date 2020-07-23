/*
 * @Author: xuxueliang
 * @Date: 2020-04-23 20:12:32
 * @LastEditors: xuxueliang
 * @LastEditTime: 2020-07-22 14:59:10
 */
/*

*/
let DBConfig = null
let _debug = true
// @ts-ignore
var mysql = require('mysql')

/**
 * @param {any} t
 */
function isNumber (t) {
  return typeof t === 'number'
}
/**
 * @param {String} sql
 */
function query (sql) {
  var connection = mysql.createConnection(
    DBConfig || {
      host: 'localhost',
      user: 'root',
      charset: 'utf8mb4',
      password: 'Root_root1234',
      database: 'wiki',
    }
  )
  return new Promise((resolve, reject) => {
    connection.connect()
    connection.query(
      sql,
      /**
       * @param {any} error
       * @param {string | any[]} results
       * @param {any} fields
       */
      function (error, results, fields) {
        connection.end()
        if (error) {
          reject(error)
          return
        }
        if (_debug) {
          console.log(`==============================`)
          console.log(sql)
          console.log(`-----------`)
          console.log(results.length)
          console.log(`==============================｜`)
          // resolve(deCodeSqlData(results))
        }
        resolve(results)
      }
    )
  })
}
/**
 * @param {object | any[]} results
 */
function deCodeSqlData (results) {
  if (Array.isArray(results)) {
    results.forEach((v) => {
      v = deCodeSqlData(v)
    })
  } else if (typeof results === 'object') {
    for (const v in results) {
      if (typeof results[v] === 'string') {
        results[v] = sqlToData(results[v])
      } else if (typeof results[v] === 'object') {
        results[v] = deCodeSqlData(results[v])
      }
    }
  } else if (typeof results === 'string') {
    results = sqlToData(results)
  }
  return results
}
/**
 * @param {any[]} where
 */
function find (...where) {
  this.way = 'SELECT'
  this.findFlag = true
    ; (this.whereObj || (this.whereObj = [])).push(where)
  return this
}

/**
 * @param {string} field
 */
function fields (field) {
  if (field.indexOf(',') > -1) {
    this.fieldsObj = (this.fieldsObj || '') + field
  } else {
    this.fieldsObj = (this.fieldsObj || '') + field.split(' ').join(',')
  }
  return this
}
// 获取where 的字符串
/**
 * @param {any[]} arrayObj
 * @param {any} tableName
 */
function getWhere (arrayObj, tableName) {
  /** @type {any[]} */
  let sql = []
  /**
   * @param {any[]} v
   * @param {any} i
   */
  arrayObj.forEach((v, i) => {
    sql.push(
      /**
       * @param {any} v
       * @param {number} i
       */
      v.map((v, i) => {
        return _getWOBj(v, i === 0 ? ' AND ' : ' OR ', tableName)
      }).join(' AND ')
    )
  })
  return sql.join(' AND ') // ans='123' AND
}
/**
 * @param {string | string[]} v
 */
function _getTi (v) {
  return v &&
    ((v + '').indexOf(' ') > -1 ||
      ['>', '<', '=', 'LIKE', '<>', 'BETWEEN', '<=', '>='].indexOf(v[0]) > -1)
    ? ' '
    : '='
}
/**
 * @param {{ [x: string]: any; }} v
 * @param {string} tableName
 */
function _getWOBj (v, flag = 'AND', tableName) {
  let sql = Object.keys(v)
    .map((o) => {
      const flag = _getTi(v[o])
      return `${ tableName ? tableName + '.' + o : o }${ flag }${
        isNumber(v[o]) ? v[o] : flag === '=' ? `"${ v[o] }"` : `${ v[o] }`
        }`
    })
    .join(flag)
  return flag === 'OR' ? '(' + sql + ')' : sql
}
// 限制
/**
 * @description : 限制条数
 * @param {type}
 * @return :
 * @param {any} nums
 */
function limit (nums) {
  this.limitNum = nums
  return this
}
/**
 * @description : 从哪里开始
 * @param {type}
 * @return :
 * @param {any} begin
 */
function skip (begin) {
  this.limitBegin = begin
  return this
}
// 获取setData
/**
 * @description : 获取更新字符串
 * @param {type}
 * @return :
 * @param {{ [x: string]: any; }} obj
 */
function getSetData (obj) {
  return Object.keys(obj)
    .map((v) => {
      return `${ v }=${
        this.updateObjType === 'sql' ? obj[v] : getInsertSqlData(obj[v])
        }`
    })
    .join(', ')
}
/**
 * @param {string} str
 */
function addFlag (str) {
  if (str.indexOf('.') > -1) {
    return str
      .split(',')
      .map((v) => {
        if (v.indexOf('.') < 0) {
          v = this.tableName + '.' + (v || '*')
        }
        v = `${ v || '*' }`
        return v
      })
      .join(',')
  }
  return str
    .split(',')
    .map((v) => {
      v = `${ v || '*' }`
      return v
    })
    .join(',')
}
/**
 * @param {string | string[]} str
 */
function deletSpace (str, flag = ' ') {
  if (str[str.length - 1] === ',' || str[str.length - 1] === ' ') {
    return deletSpace(str.substr(0, str.length - 1), flag)
  }
  return str
}
/**
 * @param {{ [x: string]: number; }} str
 */
function getOrderSql (str) {
  if (typeof str === 'object') {
    let keys = Object.keys(str)
    return keys
      .map(
        (v) =>
          `${ this.populateStr ? this.tableName + '.' + v : v } ${
          str[v] == 1 ? 'ASC' : 'DESC'
          } `
      )
      .join(',')
  } else {
    return str
  }
}
//执行
/**
 * @description: 获取sql语句
 * @param {type}
 * @return: sql
 */
function getSql () {
  let way = this.way || '' //? 'SELECT ' : this.updateObj ? 'UPDATA ' : this.deleteObj ? 'DELETE' : ''
  // select
  this.limitBegin = this.limitBegin | 0
  let count = this.countFlag ? ` Count(${ this.countFlag }) as total` : ' '
  if (this.fieldsObj) {
    this.fieldsObj = deletSpace(this.fieldsObj)
    this.fieldsObj = addFlag.call(this, this.fieldsObj)
  }
  let fields = ` ${ this.fieldsObj || '*' } `
  let table = ` FROM ${ this.tableName }`
  let update = this.updateObj
    ? ` SET ${ getSetData.call(this, this.updateObj) }`
    : ''
  let limit = this.limitNum
    ? ` limit ${ this.limitBegin },${ this.limitBegin + this.limitNum } `
    : ''
  let whStr
  if (this.whereObj && this.whereObj.length) {
    whStr = getWhere(this.whereObj, this.populateStr ? this.tableName : '')
  }
  let wh = whStr ? ` WHERE ${ whStr } ` : ''
  let order = this.orderStr
    ? ` ORDER BY ${ getOrderSql.call(this, this.orderStr) }`
    : ' '
  let populateStr = this.populateStr || ''
  if (this.way && this.way.indexOf('INSERT') > -1) {
    return way + ` ${ this.tableName } ` + this.insertStr
  } else if (this.way && this.way.indexOf('UPDATE') > -1) {
    return way + ` ${ this.tableName } ` + update + wh
  } else {
    return (
      way +
      count +
      (count !== ' ' ? '' : fields) +
      table +
      populateStr +
      update +
      wh +
      order +
      limit
    )
  }
}
/**
 * @description : 执行脚本
 * @param {type}
 * @return :
 * @this {{ tableName: any; find: typeof find; limit: typeof limit; fields: typeof fields; update: typeof update; delete: typeof deleted; order: typeof order; sort: typeof order; count: typeof count; ... 6 more ...; skip: typeof skip; }}
 */
async function exec () {
  let sql = this.getSql()
  const resArray = await query(sql)
  let res = this.FindOnlyOne
    ? resArray[0]
    : this.countFlag
      ? resArray[0].total
      : resArray
  Object.keys(this).forEach((v) => {
    if (v !== 'tableName' && typeof this[v] !== 'function') {
      delete this[v]
    }
  })
  return getSqlData(res)
}
/**
 * @description : 获取sqlData
 * @param {type}
 * @return :
 * @param {any[]} v
 */
function getSqlData (v) {
  if (!v) {
    return v
  }
  if (Array.isArray(v)) {
    return v.map(getSqlData)
  }
  Object.keys(v).forEach((v1) => {
    if (typeof v[v1] === 'object') {
      v[v1] = getSqlData(v[v1])
    }
    if (v1.indexOf('_') > -1) {
      var v2 = v1.split('_')
      if (typeof v[v2[0]] !== 'object') {
        v[v2[0]] = {}
      }
      v2.reduce(
        (a, b, i) =>
          i === v2.length - 1 ? (a[b] = v[v1]) : a[b] ? a[b] : (a[b] = {}),
        v
      )
      delete v[v1]
    }
  })

  return v
}
// count
/**
 * @description : 获取数量
 * @param {type}
 * @return :
 */
async function count (flag = '*') {
  this.way = 'SELECT'
  if (typeof flag === 'object') {
    this.countFlag = '*'
    this.find(flag)
  } else {
    this.countFlag = flag
  }
  return await this.exec()
}
// 更新
/**
 * @description : 更新数据
 * @param {type}
 * @return :
 * @param {any[]} obj
 */
async function update (...obj) {
  this.way = 'UPDATE'
  this.updateObj = obj[1] && obj[1].$set
  this.updateObjType = (obj[1] && obj[1].$type) || 'normal'
  if (!this.updateObj) {
    this.updateObj = obj[1]
  }
  this.whereObj = [[obj[0]]]
  return await this.exec()
}
/**
 * @description : 删除
 * @param {type}
 * @return :
 * @param {(arg0: any) => any[]} Obj
 */
function deleted (Obj) {
  this.way = 'DELETE'
  this.deleteObj = Obj(this.whereObj || (this.whereObj = [])).push(where)
}
function order (str = '') {
  this.orderStr = str

  return this
}
/**
 * @description : 增加
 * @param {type}
 * @return :
*/
function insert (obj = {}) {
  let keys = Object.keys(obj)
  if (keys.length) {
    this.insertStr = ` (${ keys
      .map((v) => v)
      .join(',') }) VALUES (${ keys
        .map((v) => getInsertSqlData(obj[v]))
        .join(',') })`
  }
  this.way = 'INSERT INTO'
}
const ignore = ['now()']
function getInsertSqlData (sql) {
  switch (typeof sql) {
    case 'object':
      return "'" + JSON.stringify(sql) + "'"
    case 'number':
      return +sql
    default:
      if (ignore.indexOf(sql) > -1) {
        return sql
      }
      return dataToSql(sql)
  }
}
/**
 * @param {any} str
 */
function dataToSql (str) {
  return mysql.escape(str)
}
/**
 * @param {string} str
 */
function sqlToData (str) {
  return str
}
/**
 * @description : 快速查找一个
 * @param {type}
 * @return :
 * @param {any} obj
 */
function findOne (obj) {
  this.FindOnlyOne = true
  this.find(obj)
  return this
}
/**
 * @description : 链表查找
 * @param {type}
 * @return :
 * @param {any} selects
 */
function populate (
  { table, path, select = '', keys = 'id', join = 'LEFT', name = '' } = paths,
  selects,
  key = 'id'
) {
  if (typeof paths === 'string') {
    table = paths
    path = paths
    name = path
    select = selects
    keys = key
    join = 'LEFT'
  }
  table = table || path
  select = ' ' + select
  name = name || path
  if (this.fieldsObj) {
    this.fieldsObj
  }
  this.populateStr = this.populateStr || ''
  this.populateStr =
    this.populateStr +
    ` ${ join } JOIN ${ table } ON ${ this.tableName }.${ path } = ${ table }.${ keys } `
  this.fields(
    /**
     * @param {string} v
     */
    select
      .split(' ')
      .map((v) => {
        if (v) {
          v = table + '.' + v + ' as ' + name + '_' + v
        }
        return v
      })
      .join(',')
  )
  return this
}
const ModelLink =
  /**
   * @param {any} tableNam
   */
  function (tableNam) {
    const tableName = tableNam
    // SELECT LastName,FirstName FROM Persons
    const sql = `SELECT LastName, FirstName FROM ${ tableName } `
    return creatFn(tableNam)
  }
/**
 * @param {any} tableNam
 */
function creatFn (tableNam) {
  const fn =
    /**
     * @param {any} obj
     */
    function (obj) {
      fn.insert(obj)
      return fn
    }
  Object.assign(fn, {
    tableName: tableNam,
    // whereObj: [],
    // updateObj: {},
    // fieldsObj: '',
    find,
    limit,
    fields,
    update,
    delete: deleted,
    order,
    sort: order,
    count,
    getSql,
    insert,
    findOne,
    save: exec,
    populate,
    exec,
    skip,
  })
  return fn
}
module.exports = (dbConfig, { debug = true }) => {
  DBConfig = dbConfig ? Object.assign({}, dbConfig) : null
  _debug = !!debug
  return ModelLink
}