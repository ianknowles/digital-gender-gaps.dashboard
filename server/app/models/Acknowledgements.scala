package models

import controllers.routes.Assets

object Acknowledgements {
	val primary: List[Acknowledgement] = List(
		Acknowledgement(
			href = "https://www.sociology.ox.ac.uk/",
			alt = "University of Oxford logo",
			image = Assets.versioned("images/logos/oxweb-logo-rect.svg"),
			imageCSSClass = "oxford",
		),
		Acknowledgement(
			href = "https://www.qcri.org.qa/",
			alt = "Hamad Bin Khalifa University logo",
			image = Assets.versioned("images/logos/qcri28rgb29-01.svg"),
			imageCSSClass = "qcri",
		)
	)
	val support: List[Acknowledgement] = List(
		Acknowledgement(
			href = "https://www.data2x.org/",
			alt = "data2x project logo",
			image = Assets.versioned("images/logos/data2x-logo.png"),
			imageCSSClass = "data2x",
		),
	)
}
