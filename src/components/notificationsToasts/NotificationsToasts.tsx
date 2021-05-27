import React from "react";
import ReactDOM from "react-dom";
import { FinsembleProvider } from "@finsemble/finsemble-ui/react/components/FinsembleProvider";
import "@finsemble/finsemble-ui/react/assets/css/finsemble.css";
import { NotificationsToasts } from "@finsemble/finsemble-ui/react/components/notifications";
import "../../../assets/css/theme.css";

// Create a custom representation of your notifications / display custom meta fields
// const ToastCard = (props: any) => {
// 	return (
// 		<div style={{backgroundColor:"black", height: "200px"}}>
// 			This is a custom notification card: {props.notification.id}
// 			Meta field: {props.notification.meta.id}
// 		</div>
// 	);
// }

ReactDOM.render(
	<FinsembleProvider>
		<NotificationsToasts
		// notificationCard={ToastCard}
		/>
	</FinsembleProvider>,
	document.getElementById("notifications-toasts")
);
