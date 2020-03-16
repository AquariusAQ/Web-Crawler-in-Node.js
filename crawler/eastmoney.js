var cheerio = require('cheerio')
var rp = require('request-promise')
var options = {
    uri: 'https://www.eastmoney.com',
    transform: function (body) {
        return cheerio.load(body);
    }
}

//获得二级目录信息
function getTexts(newsArr, news, callback) {
    var options = {
        uri: news.link,
        transform: function (body) {
            return cheerio.load(body);
        }
    }
    rp(options).then(function ($) {
    var item = $('.newsContent', 'div');
    news.time = item.find('.time', 'div').first().text();
    news.editor = item.find('.author', 'div').first().text();
    news.source = item.find('.source', 'div').text();
    var source = news.source;
    news.source = source.replace(/\s*/g, '');
    news.comment = item.find('.num', 'span').text();
    news.contain = item.find('.b-review', 'div').text();
    var maintext = '';
        $('.newsContent', 'div').find('.Body', 'div').children('p').each(function (idx, element) {
            maintext = maintext.concat($(element).text());
        })
    news['texts'] = maintext;
    console.log(news);
})
}

rp(options).then(function ($) {
        var newsArr = [];
        var item = $('.nlist', 'div').find('li').children('a')
        item.map(function (idx, element) {
            var news = {};
            news.title = $(element).text();
            news.link = $(element).attr('href');
            getTexts(newsArr, news, function(newsArr, news) {
                console.log(news);
                newsArr.push(news);
            });
        })
        //console.log(newsArr);
    })