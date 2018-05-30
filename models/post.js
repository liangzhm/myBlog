/**
 * Created by liangzhimin@chinaso.com on 2018/5/24
 */
var  mongodb = require('./db'),
    markdown = require('markdown').markdown
function Post(name, head, title, tags, post) {
    this.name = name
    this.head = head
    this.title = title
    this.tags = tags
    this.post = post
}
module.exports = Post
Post.prototype.save = function (callback) {
    var date = new Date()
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + '-' + (date.getMonth() + 1),
        day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
        minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' +
        (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    var post = {
        name: this.name,
        head: this.head,
        time: time,
        title: this.title,
        tags: this.tags,
        post: this.post,
        comments: [],
        pv: 0
    }
    mongodb.open(function (err,db) {
        if (err) {
            return  callback(err)
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close()
                return callback(err)
            }
            collection.insert(post, {
                safe: true,
            },function (err) {
                mongodb.close()
                if (err) {
                    return callback(err)
                }
                callback(null)
            })
        })
    })
}
Post.getAll = function (name, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err)
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close()
                return callback(err)
            }
            var query = {}
            if(name) {
                query.name = name
            }
            collection.find(query).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close()
                if(err) {
                    return callback(err)
                }
                docs.forEach(function (doc) {
                    doc.post = markdown.toHTML(doc.post)
                })
                callback(null, docs)
            })

        })
    })
}
Post.getOne = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err)
        }
        db.collection('posts', function (err, collection) {
           if (err) {
               return callback(err)
           }
           collection.findOne({
               "name": name,
               "time.day": day,
               "title": title,
           }, function (err, doc) {
               if (err) {
                   mongodb.close()
                   return callback(err)
               }
               if (doc) {
                   // 每访问一次getone接口，pv值增加1
                   collection.update({
                       "name": name,
                       "time.day": day,
                       "title": title
                   },{
                       $inc: {"pv": 1}
                   },function (err) {
                       mongodb.close()
                       if (err) {
                           return callback(err)
                       }
                   })
                  // doc.post = markdown.toHTML(doc.post)
                   /*
                   doc.comments.forEach(function (comment) {
                       comment.content = markdown.toHTML(comment.content)
                   })*/
               }
               //doc.post = markdown.toHTML(doc.post)
               callback(null, doc) // 返回查询的一篇文章
           })
        })
    })
}
Post.edit = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err)
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //根据用户名、发表日期及文章名进行查询
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, doc);//返回查询的一篇文章（markdown 格式）
            });
        });
    })
}
Post.update = function (name, day, title, post, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err)
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close()
                return callback(err)
            }
            collection.update({
                "name": name,
                "time.day": day,
                "title": title
            },{
                $set: {post: post}
            }, function (err) {
                mongodb.close()
                if (err) {
                    return callback(err)
                }
                callback(null)
            })
        })
    })
}
Post.remove = function (name, day, title, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //根据用户名、日期和标题查找并删除一篇文章
            collection.remove({
                "name": name,
                "time.day": day,
                "title": title
            }, {
                w: 1
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
}
//一次获取十篇文章
Post.getTen = function(name, page, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            var totalPage;
            //使用 count 返回特定查询的文档数 total
            collection.count(query, function (err, total) {
                //根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
                collection.find(query, {
                    skip: (page - 1)*10,
                    limit: 10
                }).sort({
                    time: -1
                }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    //解析 markdown 为 html
                    /*
                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });*/
                    totalPage = Math.ceil(total/10)
                    callback(null, docs, total, 10, totalPage);
                });
            });
        });
    });
};
Post.getArchive = function (callback) {
    // 打开数据库  //打开数据库
    mongodb.open(function (err,db) {
        if (err) {
            return callback(err)
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close()
                return callback(err)
            }
            //返回只包含 name、time、title 属性的文档组成的存档数组
            collection.find({},{
                'name': 1,
                'time': 1,
                "title": 1
            }).sort({time: -1}).toArray(function (err, docs) {
                mongodb.close()
                if (err) {
                    return callback(err)
                }
                callback(null, docs)
            })
        })
    })
}
Post.getTags = function (callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err)
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close()
                return callback(err)
            }
            // distinct 用来找出 给定键值的所有不同值
            collection.distinct('tags', function (err, docs) {
                mongodb.close()
                if (err) {
                    return callback(err)
                }
                callback(null, docs)
            })
        })
    })
}
Post.getTag = function (tag, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err)
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close()
                return callback(err)
            }
            // 查询所有tags 数组内 包含tag的文档 并返回只含有name time title 组成的数组
            collection.find({
                "tags": tag
            },{
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close()
                if (err) {
                    return callback(err)
                }
                callback(null, docs)
            })
        })

    })
}
Post.search = function (keyword, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err)
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close()
                return callback(err)
            }
            var pattern = new RegExp(keyword, "i")
            collection.find({
                "title": pattern
            },{
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close()
                if (err) {
                    return callback(err)
                }
                callback(null, docs)
            })
        })
    })
}