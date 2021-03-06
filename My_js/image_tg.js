/******************************************************
//file_apiの設定関数
******************************************************/
function fileapi_svg(){
  //file_apiの処理
  var inputFile = $('#file_svg');
  var reader = new FileReader();

  function fileChange(ev) { //ファイル選択ボタンを押下時
    var file = ev.target.files[0];
    var type = file.type;

    if (!type.match('image.*')) {
      alert('選択できるファイルはSVGファイルだけです。');
      inputFile.value = '';
      return;
    }
    reader.readAsText(file);
  }
  function fileLoad() {
    var svg_text = reader.result;
    svg_text = svg_text.replace(/<svg.+>/g, '')
    svg_text = svg_text.replace( /<\/svg>/g , "" );
    continue_setSVG(svg_text,-DRAW_AREA_WIDTH, -DRAW_AREA_HEIGHT, DRAW_AREA_WIDTH * 2, DRAW_AREA_HEIGHT * 2);
  }
  function fileClear() {
    this.value = null;
  }
  inputFile.on('click',fileClear);
  inputFile.on('change',fileChange);
  $(reader).on('load',fileLoad);
}

function fileapi_image(){
  var inputFile = $('#file_img');
  var reader = new FileReader();

  function fileChange(ev) { //ファイル選択ボタンを押下時
    var file = ev.target.files[0];
    var type = file.type;

    if (!type.match('image.*')) {
      alert('選択できるファイルは画像ファイルだけです。');
      inputFile.value = '';
      return;
    }
    reader.readAsDataURL(file);
  }
  function fileLoad() {
    import_image(reader.result); //画像の取り込み 引数には画像のアドレス
  }
  function fileClear() {
    this.value = null;
  }
  inputFile.on('click',fileClear);
  inputFile.on('change',fileChange);
  $(reader).on('load',fileLoad);
}


/******************************************************
//画像をインポートする関数
******************************************************/
function import_image(image_url){
  var image = draw.image(image_url).loaded(function(loader) {
    this.size(loader.width, loader.height)
    this.addClass('image');
    draw.select('.image').back();
    draw.select('.image').each(function(i , children){
      this.back();
    })
    cash_svg();
    let current_mode =  $('input[name="Stamp"]:checked');
    $(current_mode).prop('checked', true).trigger('change'); //モードを設定
  })
}

/******************************************************
//トリミングモードの関数
******************************************************/
function trim_start() {
  draw.select('.image').off('mouseover').mouseover(function() {
    this.attr({'cursor' : 'pointer'});
    draw.rect(this.width() , this.height()).attr({
      'fill' : 'none',
      'stroke' : 'green',
      'stroke-width' : SELECT_RECT_STROKEWIDTH * 1.5,
      'stroke-dasharray': SELECT_RECT_STROKEDOTT, //点線に
      'transform' : this.transform('matrix')
    }).addClass('image_FrameRect');
    this.off('click').click(function(){
      draw.select('.image').off();
      draw.select('.image_FrameRect').attr({
        'stroke' : '#f00',
        'stroke-dasharray': '' //実線に
      });
      trimming_AreaSelect(this);
    })
  })
  draw.select('.image').mouseout(function() {
    this.attr({'cursor' : 'default'});
    draw.select('.image_FrameRect').each(function(i,children){
      this.remove();
    })
    this.off('click');
  })

  function trimming_AreaSelect(svg_image){
    var matrix = svg_image.transform('matrix');
    var select_rect = draw.rect().addClass('select_rect');
    select_rect.attr({  //範囲指定用四角形
      'fill' : 'none',
      'stroke' : SELECT_RECT_COLOR,
      'stroke-width' : SELECT_RECT_STROKEWIDTH,
      'stroke-dasharray': SELECT_RECT_STROKEDOTT //点線に
    })
    draw.off('mousedown').on('mousedown', function(event){ //mousedown時：始点指定
      if(event.button===0) select_rect.draw(event);
    });
    draw.off('mouseup').on('mouseup', function(event){  //mouseup時：終点指定
      if(event.button===0){
        select_rect.draw(event);
        var rx = Number(select_rect.attr('x')) , ry = Number(select_rect.attr('y'));
        var rWidth = Number(select_rect.attr('width')) , rHeight = Number(select_rect.attr('height'));
        var xOffset = -rx , yOffset = -ry;
        var width = rWidth , height = rHeight;
        trim_base64(svg_image , xOffset , yOffset , width , height , matrix);
        select_rect.remove();
        $('input[name="Stamp"][value="TrimBase64"]').prop('checked', true).trigger('change'); //画像トリミングモードに再設定
      }
    })
  }

  function trim_base64(target_image , xOffset , yOffset , width , height , matrix){
    draw.select('.image_FrameRect').each(function(i,children){
      this.remove();
    })
    if(target_image.attr('href')){
      var base64image = target_image.attr('href');
    }else{
      var base64image = target_image.attr('xlink:href');
    }
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var image = new Image();

    image.crossOrigin = "Anonymous";
    image.onload = function(event){
      canvas.width = width;
      canvas.height = height;

      ctx.transform(matrix.a , matrix.b, matrix.c, matrix.d, Number(matrix.e) + xOffset , Number(matrix.f) + yOffset)
      ctx.drawImage(this, 0, 0, this.width, this.height);

      target_image.attr({
        'href' : canvas.toDataURL(),
        'width' : width,
        'height' : height,
        'transform' : ''
      })
      target_image.translate(-xOffset , -yOffset);
      cash_svg();
    };
    image.src = base64image;
  }
}
