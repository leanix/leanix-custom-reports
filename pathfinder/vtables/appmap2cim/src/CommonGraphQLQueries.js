const tagGroups = `{tagGroups: allTagGroups(sort: {mode: BY_FIELD, key: "name", order: asc}) {
		edges { node {
				id name restrictToFactSheetTypes
				tags { edges { node { id name } } }
			}}
		}}`;

export default {
	tagGroups: tagGroups
};