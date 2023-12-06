import { Behavior } from 'meteor/jagi:astronomy';

Behavior.create({
  name: 'author',
  options: {
    authorFieldName: 'createdBy',
    mandatory: false,
    immutable: true
  },
  createClassDefinition: function() {
    const definition = {
      fields: {},
      events: {
        beforeInsert: (e) => {
          const doc = e.currentTarget;
          const userId = Meteor.userId();
          if (!userId && this.options.mandatory) {
            e.preventDefault();
            throw new Meteor.Error(
              'must-be-logged-in',
              'You must be logged in to perform this operation.'
            );
          }
          doc[this.options.authorFieldName] = userId;
        }
      }
    };
    definition.fields[this.options.authorFieldName] = {
      type: String,
      immutable: this.options.immutable,
      optional: true
    };

    return definition;
  },
  apply: function(Class) {
    Class.extend(this.createClassDefinition(), ['fields', 'events']);
  }
});