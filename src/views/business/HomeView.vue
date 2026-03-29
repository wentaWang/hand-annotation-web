<template>
  <div style="padding: 20px">
    <div style="display: flex">
      <!-- <div type="primary" @click="onAddRect" style="margin: 0 8px">
        绘制矩形
      </div> -->
      <div type="primary" @click="onDrawPolygon" style="margin: 0 8px">绘制多边形</div>
      <div type="primary" @click="onNext" style="margin: 0 8px">下一个</div>
      <div type="primary" @click="onChange" style="margin: 0 8px">修改颜色</div>

      <div type="primary" @click="onGetData" style="margin: 0 8px">获取数据</div>
      <div type="primary" @click="onDraw" style="margin: 0 8px">自由绘制</div>
    </div>

    <canvas ref="canvasContainer" style="border: 1px solid rgba(69, 154, 235, 0.55)"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { Label, EMode } from 'fabric-label-utils'
const canvasContainer = ref<any>(null)
let label: any = null

const onAddRect = () => {
  label.setMode(EMode.rect)
  label.crateShape('rect', {
    left: 300,
    top: 100,
    fill: 'green',
    width: 200,
    height: 200,
  })
}
const onDrawPolygon = () => {
  label.drawPolygon()
}
const onNext = () => {
  const params: any = data.shift()
  label.init(params.imageUrl, params.data)
}
const onChange = () => {
  label.updateShape('fill', 'yellow')
}
let isDrawing = false
const onDraw = () => {
  isDrawing = !isDrawing
  label.setMode(isDrawing ? EMode.drawing : '')
}
const onGetData = () => {
  const data = label.getAllData()
  console.log(data)
}
const data = [
  {
    imageUrl: '../../assets/images/hand-left.jpg',
    data: [
      {
        type: 'rect',
        id: '1',
        options: {
          left: 100,
          top: 100,
          fill: 'green',
          width: 200,
          height: 200,
        },
      },
      {
        type: 'circle',
        id: '2',
        options: {
          left: 200,
          top: 200,
        },
      },
      {
        type: 'ellipse',
        id: '3',
        options: {
          left: 300,
          top: 300,
          rx: 100,
          ry: 50,
          fill: 'yellow',
          stroke: 'purple',
          strokeWidth: 5,
        },
      },
      {
        type: 'polygon',
        id: '4',
        options: {
          left: 200,
          top: 50,
          fill: 'yellow',
          strokeWidth: 1,
          stroke: 'grey',
          scaleX: 5,
          scaleY: 5,
          objectCaching: false,
          transparentCorners: false,
          cornerColor: 'blue',
        },
        points: [
          {
            x: 3,
            y: 4,
          },
          {
            x: 16,
            y: 3,
          },
          {
            x: 30,
            y: 5,
          },
          {
            x: 25,
            y: 55,
          },
          {
            x: 19,
            y: 44,
          },
          {
            x: 15,
            y: 30,
          },
          {
            x: 15,
            y: 55,
          },
          {
            x: 9,
            y: 55,
          },
          {
            x: 6,
            y: 53,
          },
          {
            x: -2,
            y: 55,
          },
        ],
      },
    ],
  },
  {
    imageUrl:
      'https://img0.baidu.com/it/u=726630492,657540486&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=1067',
    data: [
      {
        type: 'rect',
        id: '3',
        options: {
          left: 200,
          top: 100,
          fill: 'red',
          width: 200,
          height: 200,
        },
      },
    ],
  },
]
onMounted(() => {
  label = new Label(canvasContainer.value, {
    width: 800,
    height: 600,
  })
  onNext()

  label.events.on('selected', function (obj: any) {
    console.log('selected', obj)
  })
})
onBeforeUnmount(() => {
  label.destroy()
})
</script>

<style scoped lang="less"></style>
