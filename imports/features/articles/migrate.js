const updateInfo = () => {
  ArticleCollection.update(
    { title: { $regex: "1月", $options: "i" } },
    {
      $set: {
        coverUrl:
          "https://www.lourd.top/storage/books/storage:books/zgY3v4PSnhoHtXvpE/original/zgY3v4PSnhoHtXvpE.jpg",
      },
    },
    { multi: true }
  );
};
