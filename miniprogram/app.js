// 小程序入口：启动后直接打开 H5 页面（见 pages/index）
App({
  globalData: {
    h5Url: 'https://dog-project-git-prod-wensons-projects-bb20578e.vercel.app/'
  },
  onLaunch() {
    // 可选：从服务端或本地存储读取 H5 地址
    const url = wx.getStorageSync('h5_url');
    if (url && typeof url === 'string') {
      this.globalData.h5Url = url;
    }
  }
});
