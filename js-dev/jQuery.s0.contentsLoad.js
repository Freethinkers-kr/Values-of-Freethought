var contentsIndex = 0;
var contentsLimit = contents.length;
var userValues = {};
var maxValues = {};
var transValue = {1: -1, 2: -0.5, 3: 0, 4: 0.5, 5: 1};
var selectThisPage = false;
var questionMax = 0;

function initContents(){
  $(Object.keys(values)).each(function(){
    maxValues[this] = 0;
  });
  $(contents).each(function(){
    let item = this;
    if(item.score){
      questionMax++;
      $(Object.keys(item.score)).each(function(){
        maxValues[this] += Math.abs(item.score[this]);
      });
    }
  });
  setContents();
}

function setContents(){
  let cont = contents[contentsIndex];
  $('#desc').show();
  $('#result-canvas').hide();
  $('#desc').html(cont.desc);
  if(cont.score){
    let questionNow = contentsIndex + questionMax - contents.length + 1;
    $('#title').html("문제: "+questionNow+" / "+questionMax);
    $('#select-wrap').show();
  }else{
    $('#title').html(cont.title);
    $('#select-wrap').hide();
  }
  if(contentsIndex == 0){
    $('button.prev').hide();
  }else{
    $('button.prev').show();
  }
  if(contentsIndex == contentsLimit-1){
    $('button.next').hide();
    $('button.result').show();
  } else {
    $('button.next').show();
    $('button.result').hide();
  }
}
function nextContents(){
  if(selectThisPage || !contents[contentsIndex].score){
    contentsIndex++;
    setContents();
    $('input[type="radio"]:checked').prop("checked",false);
  }
}
function prevContents(){
  contentsIndex--;
  setContents();
  $('input[value="'+userValues[contentsIndex]+'"]').prop("checked",true);
}

var canvas = $('#result-canvas')[0];
var canvasHeight = 600;
var canvasWidth  = 1300;
var canvasDraw = canvas.getContext('2d');

var barColors = ['#7B1FA2'];
var barStart  = canvasWidth * 0.01;
var barEnd    = canvasWidth * 0.99;
var barWidth  = barEnd - barStart;
var barHeight = canvasHeight / Object.keys(values).length;
var barMargin = 10;

function resultContents(){
  if(selectThisPage || !contents[contentsIndex].score){
    $('#result-canvas').show();
    let barIndex = 0;

    $('#title').html("결과");
    $('#desc').hide();
    $('#select-wrap').hide();

    $('#result-canvas').attr('width', canvasWidth);
    $('#result-canvas').attr('height', canvasHeight);
    canvasDraw.clearRect(0, 0, canvasHeight, canvasWidth);

    $(Object.keys(values)).each(function(i, e){
      let barInfo = _barGeneration(i, e);
      let pos = barInfo.position;
      let fontSize = barHeight*1/2;
      canvasDraw.fillStyle = "#000000";
      canvasDraw.fillRect(barStart, pos.yi, barWidth, pos.yf);
      canvasDraw.fillStyle = barColors[ barIndex % barColors.length];
      canvasDraw.fillRect(pos.xi, pos.yi, pos.xf, pos.yf);
      canvasDraw.font = 'bold '+fontSize+'px "Gothic A1"';
      canvasDraw.fillStyle = "#FAFAFA";
      canvasDraw.textAlign = 'left';
      canvasDraw.fillText(barInfo.name, pos.xi+5, pos.yi+pos.yf-15);
      canvasDraw.textAlign = 'right';
      canvasDraw.fillText(barInfo.percent, barEnd-5, pos.yi+fontSize);
    });
  }
}

function _barGeneration(index, key) {
  let max = maxValues[key];
  let ratio = (_getScore(key) + max ) / (max * 2);
  return {
    'name': values[key],
    'position': {
      'xi': barStart,
      'xf': barWidth * ratio,
      'yi': (index * barHeight) + barMargin,
      'yf': barHeight - (barMargin * 2),
    },
    'percent': new String((ratio*100).toFixed(1))+" %",
  };
}

function _getScore(key) {
  let val = 0;
  $(Object.keys(userValues)).each(function(){
    let userSelectVal = this
    if(userValues[userSelectVal]){
      let score = contents[userSelectVal].score;
      $(Object.keys(score)).each(function(){
        if(this == key){
          let tmpVal = parseFloat(transValue[userValues[userSelectVal]]);
          let addVal = tmpVal * parseFloat(score[this]);
          val += addVal;
        }
      });
    }
  });
  return val;
}
$('input[name=radio-group]').click(function(){
  selectThisPage = true;
  userValues[contentsIndex] = $(this).attr('value');
});
