<script>
	export default {
		onLaunch: function() {
			console.log('App Launch');
			try {
				uni.getSystemInfo({
					success: function (res) {
						uni.setStorageSync( 'SystemInfo', {...res} );
					}
				});
			} catch (error) { }
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
@import '@/uni_modules/uni-scss/index.scss';
@import '@/static/customicons.css';

[v-cloak] {display: none;}
page {
	background-color: #f2f1f7;
	font-family: 'Microsoft YaHei', Arial, Helvetica, sans-serif;
}
</style>
