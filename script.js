document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = document.getElementById('video-player');
    const musicListElement = document.getElementById('music-list');
    const currentSongTitle = document.getElementById('current-song-title');
    const visualizerBars = document.querySelectorAll('.bar');
    const toggleLoopButton = document.getElementById('toggle-loop');
    const toggleSequentialButton = document.getElementById('toggle-sequential');

    let tracks = [];              // JSONから読み込まれるトラックデータの配列
    let currentMediaIndex = -1;   // 現在再生中の曲のインデックス
    let isLooping = true;         // 単曲リピートモード
    let isSequential = false;     // 順番再生モード

    // --- ユーティリティ関数 ---

    /**
     * 再生モードの状態を更新し、UIを切り替える
     */
    function updatePlaybackMode(loop, sequential) {
        isLooping = loop;
        isSequential = sequential;

        // 単曲ループ設定。順番再生モードではfalseにする。
        videoPlayer.loop = isLooping; 

        // ボタンの active クラスを切り替える
        if (isLooping) {
            toggleLoopButton.classList.add('active');
            toggleSequentialButton.classList.remove('active');
        } else if (isSequential) {
            toggleLoopButton.classList.remove('active');
            toggleSequentialButton.classList.add('active');
        } else {
            // 安全策：両方オフになることはないが、念のため
            toggleLoopButton.classList.remove('active');
            toggleSequentialButton.classList.remove('active');
        }
    }

    // --- メディア処理関数 ---

    /**
     * JSONファイルからトラックリストを読み込む
     */
    async function loadTracks() {
        try {
            // tracks.json ファイルを非同期でフェッチ
            const response = await fetch('tracks.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            tracks = await response.json();
            renderMusicList();
        } catch (e) {
            console.error("トラックリストの読み込み中にエラーが発生しました:", e);
            // ユーザーにエラーを通知
            musicListElement.innerHTML = '<li style="color: red; padding: 10px;">トラックリストの読み込みに失敗しました。ファイルを確認してください。</li>';
        }
    }

    /**
     * トラックリストをHTMLにレンダリングする
     */
    function renderMusicList() {
        musicListElement.innerHTML = '';
        
        tracks.forEach((track, index) => {
            const listItem = document.createElement('li');
            listItem.classList.add('music-item');
            
            // titleとartistを組み合わせて表示
            listItem.textContent = `${track.title} - ${track.artist}`;
            
            listItem.dataset.index = index; // インデックスを保持

            listItem.addEventListener('click', () => {
                playMedia(index); // インデックスを渡す
            });
            musicListElement.appendChild(listItem);
        });
    }

    /**
     * 指定されたインデックスのメディアを再生する
     * @param {number} index - 再生するメディアのインデックス
     */
    function playMedia(index) {
        if (index < 0 || index >= tracks.length) {
            console.error("無効なメディアインデックスです。");
            return;
        }

        currentMediaIndex = index;
        const currentTrack = tracks[currentMediaIndex];
        
        // UI上のactiveクラスを更新
        const allListItems = document.querySelectorAll('.music-item');
        allListItems.forEach(item => item.classList.remove('active'));
        
        const currentItem = musicListElement.querySelector(`[data-index="${currentMediaIndex}"]`);
        if (currentItem) {
            currentItem.classList.add('active');
            currentSongTitle.textContent = currentItem.textContent;
        }

        // URLを直接設定
        videoPlayer.src = currentTrack.url;
        videoPlayer.play();
        
        // アニメーションを開始
        visualizerBars.forEach(bar => {
            bar.style.animationPlayState = 'running';
        });
    }
    
    // --- イベントリスナー ---

    // リピートボタンのイベントリスナー
    toggleLoopButton.addEventListener('click', () => {
        updatePlaybackMode(true, false);
    });

    // 順番再生ボタンのイベントリスナー
    toggleSequentialButton.addEventListener('click', () => {
        updatePlaybackMode(false, true);
        // 順番再生に切り替えた直後、かつ曲が再生中の場合、次の曲で停止しないように videoPlayer.loop を false にする
        videoPlayer.loop = false;
    });

    // 再生が終了したときのイベントリスナー (順番再生のロジック)
    videoPlayer.addEventListener('ended', () => {
        if (isSequential) {
            // 順番再生モードの場合
            let nextIndex = (currentMediaIndex + 1) % tracks.length; // 次のインデックス (最後なら最初へ)
            playMedia(nextIndex);
        }
        // isLooping (単曲リピート) の場合はvideoPlayer.loopが処理するため何もしない
        // isLoopingとisSequentialが両方falseの場合、再生終了後に停止する
    });

    // アニメーション制御
    videoPlayer.addEventListener('pause', () => {
        visualizerBars.forEach(bar => {
            bar.style.animationPlayState = 'paused';
        });
    });

    videoPlayer.addEventListener('play', () => {
        visualizerBars.forEach(bar => {
            bar.style.animationPlayState = 'running';
        });
    });
    
    // ページロード時はアニメーションを停止しておく
    visualizerBars.forEach(bar => {
        bar.style.animationPlayState = 'paused';
    });
    
    // --- 初期化処理 ---
    updatePlaybackMode(true, false); // 初期モード設定
    loadTracks(); // トラックリストの読み込み開始
});
