module.exports = {
    template: require('timeline.html'),
    data: function() {
        return {
            showSpinner: false,
            data: []
        }
    },
    props: ['context','navigateToAction','viewAction', 'messages', 'getFileIcon', 'socialFeed'],
    created: function() {
        let that = this;
        Vue.nextTick(function() {
            that.init();
        });

    },
    methods: {
        showMessage: function(title, body) {
            this.messages.push({
                title: title,
                body: body,
                show: true
            });
        },
        navigateTo: function (entry) {
            this.close();
            this.navigateToAction(entry.path, entry.isDirectory ? null : entry.name);
        },
        view: function (entry) {
            this.close();
            if (entry.isDirectory) {
                this.navigateToAction(entry.path, null);
            } else {
                this.viewAction(entry.path, entry.name);
            }
        },
        createTimelineEntry: function(entry) {
            var future = peergos.shared.util.Futures.incomplete();
            let that = this;
            let info = entry.sharer + " has shared";
            if(entry.cap.isWritable() ) {
                info = info + " read/write access to";
            } else {
                info = info + " read access to";
            }
            this.context.getByPath(entry.path).thenApply(function(file) {
                if (file.ref == null) {
                    return;
                }
                let props = file.ref.props;
                if (props.isHidden) {
                    return;
                }
                if (props.isDirectory) {
                    info = info + " the directory";
                } else {
                    info = info + " the file";
                }
                if (entry.sharer != entry.owner) {
                    info = info + " owned by " + entry.owner;
                }
                info = info + ": ";
                let path = props.isDirectory ? entry.path : entry.path.substring(0, entry.path.lastIndexOf(props.name) -1);
                let item = {
                    info: info,
                    link: entry.path,
                    path: path,
                    name: props.name.length > 25 ? props.name.substring(0,22) + '...' : props.name,
                    hasThumbnail: props.thumbnail.ref != null,
                    thumbnail: props.thumbnail.ref == null ? null : file.ref.getBase64Thumbnail(),
                    isDirectory: props.isDirectory,
                    file : file.ref
                };
                return future.complete(item);
            }).exceptionally(function(throwable) {
                console.log("error loading timeline entry: " + throwable.getMessage());
            });
            return future;
        },
        getFileIconClass: function(file) {
            return this.getFileIcon(file);
        },

	    init: function() {
            var that = this;
            that.showSpinner = true;
            var ctx = this.context;
            this.socialFeed.getShared(0, 100, ctx.crypto, ctx.network).thenApply(function(items) {
                let arr = items.toArray();
                let numberOfEntries = arr.length;
                let allTimelineEntries = [];
                arr.forEach(function(entry,idx){
                    that.createTimelineEntry(entry).thenApply(function(timelineEntry){
                        allTimelineEntries.push(timelineEntry);
                        if (numberOfEntries == idx + 1) {
                            that.data = allTimelineEntries;
                            that.showSpinner = false;
                        }
                    });
                });
            }).exceptionally(function(throwable) {
                that.showMessage(throwable.getMessage());
                that.showSpinner = false;
            });
        },
        close: function () {
            this.$emit("hide-timeline");
        }
    }
}
