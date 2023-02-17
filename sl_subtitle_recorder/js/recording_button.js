class recording_button {
    constructor(id, state) {
        this.id = id;
        this.button = document.getElementById(id);
        this.state = state;
        //this.button = document.createElement('button');
        //this.button.setAttribute('id', id);
        //this.button.setAttribute('class', 'record-button');

        $('#' + this.id).addClass("notRec");

        $('#' + this.id).click(function(){
            if($('#' + this.id).hasClass('notRec')){
                $('#' + this.id).removeClass("notRec");
                $('#' + this.id).addClass("Rec");
                if(state !== null && state.youtube_player !== null) {
                    state.youtube_player.player.seekTo(state.previous_recording_end_time);
                }
            }
            else{
                $('#' + this.id).removeClass("Rec");
                $('#' + this.id).addClass("notRec");
                if(state !== null && state.youtube_player !== null) {
                    state.previous_recording_end_time = state.youtube_player.player.playerInfo.currentTime;
                }
                //this.state.previous_recording_end_time = this.state.youtube_player.player.playerInfo.currentTime;
            }
        });

    }

    is_recording_mode_on() {
        return $('#' + this.id).hasClass('Rec');
    }

    toString() {
        return `recording button state is ${this.is_recording_mode_on()}`;
    }
}

