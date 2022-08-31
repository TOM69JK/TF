//信息获取 = type=http-request,pattern=^https:\/\/testflight\.apple\.com\/v3\/accounts/.*\/apps$,requires-body=0,script-path=https://raw.githubusercontent.com/DecoAri/JavaScript/main/Surge/TF_keys.js
//加入测试 = type=cron,cronexp="*/2 * * * * *",script-path=https://raw.githubusercontent.com/DecoAri/JavaScript/unfinished/Surge/Auto_Join_TF.js,wake-system=0
//[MITM]
//hostname = %APPEND% testflight.apple.com
//⚠️ 使用方法：
//1、开启surge http api
//2、打开“信息获取”脚本后打开testflight app获取信息，然后注释该脚本
//3、手动在surge 脚本编辑器里点击左下角设置图标，点击$persistentStore，添加命名为"APP_ID"和"APP_ID2"的持久化数据，数据key（内容）为tf链接 https://testflight.apple.com/join/LPQmtkUs 的join后的字符串（也就是此例子的“LPQmtkUs+xxx”）

!(async () => {
ids = $persistentStore.read('APP_ID')
if (ids == '') {
	$notification.post('所有TF已加入完毕','模块已自动关闭','')
	$done($httpAPI('POST', '/v1/modules', {'Auto module for JavaScripts': 'false'}))
} else {
  ids = ids.split(',')
  await list(ids)
	$done()
}
})();

async function list(ids) {
	for (const id of ids) {
		await autoPost(id)
	}
}

function autoPost(ID) {
  let Key = $persistentStore.read('key')
  let testurl = 'https://testflight.apple.com/v3/accounts/' + Key + '/ru/'
  let header = {
    'X-Session-Id': `${$persistentStore.read('session_id')}`,
    'X-Session-Digest': `${$persistentStore.read('session_digest')}`,
    'X-Request-Id': `${$persistentStore.read('request_id')}`
  }
  return new Promise(function(resolve) {
    $httpClient.get({url: testurl + ID,headers: header}, function(error, resp, data) {
      if (error === null) {
        let jsonData = JSON.parse(data)
        if (jsonData.data.status == 'FULL') {
          console.log(ID + ' ' + jsonData.data.message)
          resolve();
        } else {
          $httpClient.post({url: testurl + ID + '/accept',headers: header}, function(error, resp, body) {
            let jsonBody = JSON.parse(body)
            $notification.post(jsonBody.data.name, 'TestFlight加入成功', '')
            console.log(jsonBody.data.name + ' TestFlight加入成功')
						ids = $persistentStore.read('APP_ID').split(',')
						console.log(ids)
						if (ids.indexOf(ID)) {
							console.log('in ' + ID)
							ids.splice(ids.indexOf(ID), 1)
							ids = ids.toString()
							$persistentStore.write(ids,'APP_ID')
							resolve()
						} else if (ID == $persistentStore.read('APP_ID')) {
							console.log('=' + ID)
							$persistentStore.write('','APP_ID')
							resolve()
						} else {
							console.log('else ' + ID)
							resolve()
						}
          });
        }
      } else {
        if (error =='The request timed out.') {
          resolve();
        } else {
          $notification.post('自动加入TF', error,'')
          console.log(ID + ' ' + error)
          resolve();
        }
      }
    })
  })
}
