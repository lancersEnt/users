const getSender = async (id: string) => {
  const endpoint = 'http://localhost:9009/graphql';
  const headers = {
    'content-type': 'application/json',
  };

  const graphqlQuery = {
    query: `
        query ExampleQuery($userId: String!) {
          user(id: $userId) {
            username
            firstname
            lastname
            permissions
          }
        }
      `,
    variables: {
      userId: id,
    },
  };

  const options = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(graphqlQuery),
  };

  const response = await fetch(endpoint, options);
  const data = await response.json();

  return data.data.user;
};

export default getSender;
