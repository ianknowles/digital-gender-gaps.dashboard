package models

import controllers.routes

object Team {
	val people: List[TeamMember] = List(
		TeamMember(
			name = "Ridhi Kashyap",
			job = "Associate Professor",
			desc = "Ridhi is associate professor of social demography at the University of Oxford and professorial fellow" +
				"of Nuffield College. She is the Principal Investigator of the Digital Gender Gaps project. Her research" +
				"spans different areas of demography and sociology. As a part of the Digital Gender Gaps project, she along" +
				"with her collaborators are studying gender inequalities in internet and mobile use and their implications" +
				"for other types of social inequalities. Her other research is on topics such as son preference, prenatal sex" +
				"selection and gender gaps in health and mortality, and the effects of educational expansion on marriage and" +
				"family change. Her methodological interests focus on how computational innovations both in terms of" +
				"modelling approaches and digital data from web and social media platforms can be applied to study social and" +
				"demographic phenomena. She is especially interested in how big data can be used to measure and monitor" +
				"sustainable development goals.",
			imageURL = routes.Assets.versioned("images/staff/128-015-RidhiKashyap.jpg"),
			links = List(
				Link("file-person", "https://www.nuffield.ox.ac.uk/people/profiles/ridhi-kashyap/", "Oxford contact profile"),
				Link("twitter", "https://twitter.com/ridhikash07", "ridhikash07"),
				Link("linkedin", "https://linkedin.com/in/ridhi-kashyap-88600b15b/", "ridhi-kashyap")
			)
		),
		TeamMember(
			name = "Ingmar Weber",
			job = "Research Director",
			desc = "Ingmar Weber is the Research Director for Social Computing at the Qatar Computing Research Institute" +
				"(QCRI). His interdisciplinary research looks at what online user-generated data can tell us about the" +
				"offline world and society at large. He works with sociologists, political scientists, demographers and" +
				"medical professionals to address topics ranging from digital gender gaps, to lifestyle diseases to improving" +
				"population statistics. Prior to joining QCRI, Ingmar Weber was a researcher at Yahoo Research Barcelona" +
				"where he pioneered the use of Big Data to monitor international migration.",
			imageURL = routes.Assets.versioned("images/staff/Dr.-Ingmar-Weber.jpg"),
			links = List(
				Link("twitter", "https://twitter.com/ingmarweber", "ingmarweber"),
				Link("linkedin", "https://linkedin.com/in/ingmarweber", "ingmarweber")
			)
		),
		TeamMember(
			name = "Masoomali Fatehkia",
			job = "Research Assistant",
			desc = "Masoomali is a research assistant at the Social Computing group of the Qatar Computing Research" +
				"Institute (QCRI). His research is focused on the use of social media advertising data to augment traditional" +
				"statistical sources for monitoring development goals. His involvement with the Digital Gender Gaps project" +
				"began in the summer of 2017 when he visited QCRI as part of Princeton University’s International Internships" +
				"Program. He completed his undergraduate studies at Princeton University in 2018 where he majored in" +
				"Operations Research with certificates (minors) in Statistics & Machine Learning and Applications of" +
				" Computing.",
			imageURL = routes.Assets.versioned("images/staff/Masoomali_Fatehkia.jpg"),
			links = List(Link("twitter", "https://twitter.com/MFatehkia", "MFatehkia"))
		),
		TeamMember(
			name = "Ian Knowles",
			job = "DevOp",
			desc = "Ian is the LCDS data engineer with an academic background and wide-ranging experience in industry. He" +
				"has development experience in most major languages and has worked on projects that range from embedded" +
				"device firmware and applications, to desktop and mobile applications, and on to full stack web server" +
				"development and operations.\nHe developed the website backend, frontend, and converted the visualisations to" +
				"web formats.",
			imageURL = routes.Assets.versioned("images/staff/ian.jpg"),
			links = List(Link(icon = "github", url = "https://github.com/ianknowles", text = "ianknowles"))
		)
	)
}
