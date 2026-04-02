// Web mock for react-native-maps
const React = require("react");
const { View, Text } = require("react-native");

const MapView = ({ children, style }) =>
  React.createElement(View, { style: [{ backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center" }, style] },
    React.createElement(Text, { style: { color: "#6b7280", fontSize: 13 } }, "Map (mobile only)"),
    children
  );

const Marker = () => null;

module.exports = MapView;
module.exports.default = MapView;
module.exports.Marker = Marker;
