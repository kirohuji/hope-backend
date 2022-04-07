import { FilesCollection } from 'meteor/ostrio:files';

const Images = new FilesCollection({
  collectionName: 'Images',
	allowClientCode: true,
	downloadRoute: '/images/',
	storagePath: 'assets/images/avatars/',
});
export default Images