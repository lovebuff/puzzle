var canvas = null,ctx = null,dpr = wx.getSystemInfoSync().pixelRatio
Page({
  data: {
    board_volume:360,//拼图宽高rpx
    board_list:[],//拼图数组
    board_index:15,//下标
    axis:[],//xy轴
    frequency:0,//次数
    board_src:wx.getStorageSync('board_src'),//图片拼图
    show:false,
  },
  onLoad(options){
    var that = this
    wx.createSelectorQuery().select('#myCanvas')
    .fields({ node: true, size: true })
    .exec((res) => {
      canvas = res[0].node
      ctx = canvas.getContext('2d')
      canvas.width = res[0].width * dpr
      canvas.height = res[0].height * dpr
      ctx.scale(dpr, dpr)
      if(that.data.board_src){
        that.canvasDraw();
      }
      setTimeout(function () {
        that.board_tab()
      }, 500)
    })
  },
  show_tab(e){
    this.setData({
      show:!this.data.show
    })
  },
  canvasDraw(){
    var board_src = this.data.board_src,board_volume = this.data.board_volume;
    ctx.clearRect(0, 0, board_volume, board_volume)
    var img = canvas.createImage();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, board_volume, board_volume)
    };
    img.src = board_src
  },
  reset(e){
    var that = this
    wx.showLoading({
      title: '加载中',
    })
    that.data.axis = []
    that.data.board_list = []
    that.data.board_index = 15
    that.data.frequency = 0
    if(e == 1){
      that.canvasDraw()
    }else if(e.currentTarget.dataset.status){
      that.setData({
        board_src:''
      })
      wx.setStorageSync('board_src', '')
    }
    if(e == 1){
      setTimeout(function () {
        that.board_tab()
      }, 500)
    }else{
      that.board_tab()
    }
  },
  board_tab(){
    var that = this,board_list = that.data.board_list,axis = that.data.axis,number,x,y,volume = that.data.board_volume / 4,board_src = that.data.board_src;
    for(let i = 0;i < 16;i++){
      number = parseInt(i / 4)
      x = i - number * 4
      axis.push({x:(x  * volume) + (x * 10),y:number * volume + (number * 10)})
      if(board_src){
        wx.canvasToTempFilePath({
          x: x  * volume,
          y: number * volume,
          width:volume,
          height:volume,
          canvas: canvas,
          success: function (res) {
            if(board_list.length < 15){
              board_list.push({
                value:i + 1,
                index:i,
                src:res.tempFilePath
              })
            }else{
              that.random()
            }
          }
        });
      }else if(board_list.length < 15){
        board_list.push({
          value:i + 1,
          index:i,
          src:''
        })
      }else{
        that.random()
      }
    }
  },
  random(e){
    var board_list = this.data.board_list,axis = this.data.axis;
    for (let i = 1; i < board_list.length;i++) {
      const random = Math.floor(Math.random() * (i + 1));
      [board_list[i].index, board_list[random].index] = [board_list[random].index, board_list[i].index];
    }
    wx.hideLoading()
    this.setData({
      axis:axis,
      board_list:board_list,
      frequency:this.data.frequency,
    })
  },
  upload(e){
    var that = this
    wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      success (res) {
        const tempFilePaths = res.tempFilePaths[0]
        that.setData({
          board_src:tempFilePaths,
        })
        wx.setStorageSync('board_src', tempFilePaths)
        that.reset(1)
      }
    })
  },
  preview(e){
    wx.previewImage({
      current: this.data.board_src,
      urls: [this.data.board_src]
    })
  },
  switch_tab(e){
    var that = this
    var index = e.currentTarget.dataset.index,board_index = that.data.board_index,board_list = that.data.board_list,temp,list;
    var x_min = parseInt(board_index / 4) * 4,x_max = parseInt(board_index / 4 + 1) * 4,arr = [];
    if(index >= x_min && index < x_max){
      list = board_index - index
      for(let i = 0;i < Math.abs(list);i++){
        for(let j = 0;j < board_list.length;j++){
          if((index + (list > 0?i:-i)) == board_list[j].index){
            arr.push(j)
            break;
          }
        }
      }
      for(let i = 0;i < arr.length;i++){
        board_list[arr[i]].index = index + (list > 0?i + 1:-i - 1)
      }
      that.settle(index)
      return
    }
    var y = '',y_arr = [];
    for(let i = 1;i < 4;i++){
      y = board_index - (4 * i)
      if(y >= 0){
        y_arr.push(y)
      }else{
        break;
      }
    }
    for(let i = 1;i < 4;i++){
      y = board_index + (4 * i)
      if(y <= 15){
        y_arr.push(y)
      }else{
        break;
      }
    }
    for(let i =0;i < y_arr.length;i++){
      if(index == y_arr[i]){
        list = (board_index - index) / 4
        for(let i = 0;i < Math.abs(list);i++){
          for(let j = 0;j < board_list.length;j++){
            if((index + (list > 0?i * 4:(-i) * 4)) == board_list[j].index){
              arr.push(j)
              break;
            }
          }
        }
        for(let i = 0;i < arr.length;i++){
          board_list[arr[i]].index = index + (list > 0?(i + 1) * 4:(-i - 1) * 4)
        }
        that.settle(index)
        return;
      }
    }
  },
  settle(index){
    var board_list = this.data.board_list,board_index = this.data.board_index,frequency = this.data.frequency;
    board_index = index
    frequency += 1
    this.setData({
      board_list:board_list,
      board_index:board_index,
      frequency:frequency,
    })
    for(let i = 0;i < board_list.length;i++){
      if(board_list[i].index != i){
        return
      }
    }
    wx.showModal({
      title: '提示',
      content: '恭喜你移动了'+frequency+'次完成拼图',
      showCancel:false,
      confirmText:'我知道了'
    })
  },
})
