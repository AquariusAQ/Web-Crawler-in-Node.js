var cheerio = require('cheerio')
var rp = require('request-promise')
var iconv = require('iconv-lite');

var options = {
    uri: 'https://news.163.com',
    encoding: null,
    transform: function (body) {
    body = iconv.decode(body, 'gbk');
        return cheerio.load(body);
    }
}

//获得二级目录信息
function getTexts(newsArr, news, callback) {
    var options = {
        uri: news.link,
        encoding: null,
        transform: function (body) {
            body = iconv.decode(body, 'gbk');
            return cheerio.load(body);
        }
    }
    rp(options).then(function ($) {
    var item = $('.post_content_main', 'div');
    news.time = item.find('.post_time_source', 'div').text().slice(0, 36).replace(/\s*/g, '');
    news.editor = item.find('.ep-editor', 'span').text();
    news.source = item.find('.post_time_source', 'div').children('a').first().text();
    news.comment = item.find('.post_cnum_tie', 'a').text();
    var maintext = '';
        $('.post_text', 'div').children('p').each(function (idx, element) {
            maintext = maintext.concat($(element).text()).replace(/\s*/g, '');
        })
    news['texts'] = maintext;
    console.log(news);
})
}

rp(options).then(function ($) {
        var newsArr = [];
        var item = $('.mod_top_news2', 'div').find('li');
        item.map(function (idx, element) {
            var news = {};
            news.title = $(element).find('a').text();
            news.link = $(element).find('a').attr('href');
            getTexts(newsArr, news, function(newsArr, news) {
            //console.log(news);
            //newsArr.push(news);
            });
        })
        //console.log(newsArr);
    })