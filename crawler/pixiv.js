var cheerio = require('cheerio')
var rp = require('request-promise')
var request = require('request')
var fs = require('fs');
var Agent = require('socks5-https-client/lib/Agent');
var tag = '比那名居天子';
var headers = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'
}

var options = {
    strictSSL: true,
    agentClass: Agent,
    agentOptions: {
        socksHost: '*.*.*.*',
        socksPort: *,
        socksUsername: '*',
        socksPassword: '*'
    }, //使用socks代理
    uri: encodeURI('https://www.pixiv.net/ajax/search/illustrations/'  + tag + '?word=' + tag + '&order=date_d&mode=all&p=1&s_mode=s_tag_full&type=illustrations'),
    headers: headers,
    transform: function (body) {
        return cheerio.load(body);
    }
}

var downloadAmount = 50; //下载图片总数
var downloading = 0; //正在下载图片序号
var success = 0; //下载成功数
var fail = 0; //下载失败数
var downloaded = 0; //已存在数
var fails = [] //下载失败列表
var listArr = []; //已经下载的图片列表
var total = 0; //一次抓取的图片数

rp(options).then(function ($) {
    var str = $('body').html();
    str = str.replace(/&quot;/g,'"');
    var json = JSON.parse(str);

    var data = json.body.illust.data; //从搜图结果json中提取含有每张图id的数组

    var list = fs.readFileSync("./images/list.json");
    listArr = JSON.parse(list);

    downloading = 0;
    success = 0;
    fail = 0;
    downloaded = 0;
    total = 0;

    for(var element = 0; element <data.length; element++){
        var id = data[element].id;
        var url = data[element].url;
        if (url!=undefined) {
            total++;
            url = url.replace(/c\/250x250_80_a2\/img-master/g,'img-original');
            urlJpg = url.replace(/_square1200.jpg/g,'.jpg'); //jpg格式图片的url
            urlPng = url.replace(/_square1200.jpg/g,'.png'); //png格式图片的url
            var referer = 'http://www.pixiv.net/member_illust.php?mode=big&illust_id=' + id;
            var Jpg_options = {
                strictSSL: true,
                agentClass: Agent,
                agentOptions: {
                    socksHost: '164.155.115.161',
                    socksPort: 25002,
                    socksUsername: 'aquarius',
                    socksPassword: '123454321'
                },
                uri: urlJpg,
                headers: {
                    'referer': referer,
                    //'Content-Type': "application/x-www-form-urlencoded; charset=UTF-8",
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.75 Safari/537.36'
                },
                transform: function (body) {
                    return cheerio.load(body);
                }
            }
            var Png_options = {
                strictSSL: true,
                agentClass: Agent,
                agentOptions: {
                    socksHost: '164.155.115.161',
                    socksPort: 25002,
                    socksUsername: 'aquarius',
                    socksPassword: '123454321'
                },
                uri: urlPng,
                headers: {
                    'referer': referer,
                    //'Content-Type': "application/x-www-form-urlencoded; charset=UTF-8",
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.75 Safari/537.36'
                },
                transform: function (body) {
                    return cheerio.load(body);
                }
            }
            //如果当前图片未被下载过，则下载
            if(listArr.includes(id)==false) {
                //若当前下载量未到下载总数，则继续下载
                if(element < downloadAmount) {
                    download(Jpg_options, Png_options, id);
                }
            } else {
                downloading++;
                downloaded++;
                console.log("第 " + downloading + '/' + downloadAmount + " 张已经下载过！ID: " + id);
                if(downloading==downloadAmount) {
                    finishDownload();
                }
            }
        }
    }
})
//通过判断访问url得到的状态码是否是404来判断图片是jpg格式还是png格式
function download(Jpg_options, Png_options, id) {
    request(Jpg_options, function (error, response, body) {
        var now_options = Jpg_options;
        if(response.statusCode!=404) {
            var name = id + '_0.jpg';
            var writeStream = fs.createWriteStream("./images/"+name);
            var readStream = request(now_options);
            readStream.pipe(writeStream);
            writeStream.on("finish", function() {
                downloading++;
                success++;
                console.log("第 " + downloading + '/' + downloadAmount + " 张下载成功！ID: " + id);
                writeStream.end();
                listArr.push(id);
                if(downloading==downloadAmount) {
                    finishDownload();
                }
            });
        } else {
            request(Png_options, function (error, response, body) {
                var now_options = Png_options;
                if(response.statusCode!=404) {
                    var name = id + '_0.png';
                    var writeStream = fs.createWriteStream("./images/"+name);
                    var readStream = request(now_options);
                    readStream.pipe(writeStream);
                    writeStream.on("finish", function() {
                        downloading++;
                        success++;
                        console.log("第 " + downloading + '/' + downloadAmount + " 张下载成功！ID: " + id);
                        writeStream.end();
                        listArr.push(id);
                        if(downloading==downloadAmount) {
                            finishDownload();
                        }
                    });
                } else {
                    downloading++;
                    fail++
                    console.log("第 " + downloading + '/' + downloadAmount + " 张下载失败！ID: " + id);
                    fails.push(id)
                    if(downloading==downloadAmount) {
                        finishDownload();
                    }
                }
            });
        }
    });
}

function finishDownload() {
    //console.log(listArr);
    var finallist=JSON.stringify(listArr, '', '\t');
    fs.writeFileSync("./images/list.json", finallist);
    console.log('全部下载完毕！共抓取到 ' + total + " 张，计划下载 " + downloadAmount + " 张，其中 " + downloaded + " 张已存在，下载成功 " + success + " 张，下载失败 " + fail + " 张。");
    if(fail>0) {
        console.log('下载失败：' + fails);
    }
    process.exit();
}