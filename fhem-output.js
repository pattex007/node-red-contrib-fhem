module.exports = function (RED) {
    function output(config) {
        RED.nodes.createNode(this, config);

        let fhem = RED.nodes.getNode(config.fheminstance);

        var node = this;
        node.on('input', function (msg) {
            if (!msg.hasOwnProperty("action")) msg.action = "toggle";
            data = "set " + config.Device + " " + msg.action;
            this.log(data);
            fhem.eventEmitter.emit("data_send", data);
        });
        fhem.eventEmitter.on("connected", () => {
            this.status({ fill: "green", shape: "dot", text: "connected" });
        });
        fhem.eventEmitter.on("disconnected", () => {
            this.status({ fill: "red", shape: "dot", text: "disconnected" });
        });
    }
    RED.nodes.registerType("fhem-out", output);
}