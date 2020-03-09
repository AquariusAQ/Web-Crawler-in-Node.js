var cheerio = require('cheerio')
var rp = require('request-promise')
var options = {
    uri: 'https://xueqiu.com',
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
            //获得source
            news.source = $('.article__bd__from', 'div').children('a').text();
            //获得texts，并且清除无效部分
            var texts = news.texts;
            $('.article__bd__detail', 'div').children('p').each(function (idx, element) {
                texts.push({
                    texts: $(element).text()
                })
            })
            texts.shift();
            for (var i = 0, n = 0; i < texts.length; i++) {
                if (texts[i].texts.length == 0) {
                    texts.splice(i, 1);
                }
            }
            console.log(news); //直接输出news，不再push入newsArr中
        })
    //callback(newsArr, news);
}

rp(options).then(function ($) {
        var newsArr = [];
        var item = $('.AnonymousHome_home__timeline__item_3vU', 'div')
        item.map(function (idx, element) {
            var news = {};
            news.title = $(element).find('h3').children('a').text();
            news.link = "https://xueqiu.com" + $(element).find('h3').children('a').attr('href');
            news.editor = $(element).find('div').children('a').text();
            news.source = '';
            temp1 = $(element).find('.AnonymousHome_category_5zp').text().split(' ');
            news.category = temp1[temp1.length - 1];
            temp2 = $(element).find('div').children('span').text();
            news.time = temp2.substr(temp2.length - 11, temp2.length);
            news.read = $(element).find('.AnonymousHome_read_2t5').text();
            news.contain = $(element).find('p').text();
            news.texts = [];
            getTexts(newsArr, news, function(newsArr, news) {
                newsArr.push(news);
            });
        })
        //console.log(newsArr);
    })