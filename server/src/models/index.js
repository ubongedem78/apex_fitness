const sequelize = require('../config/database');
const User = require('./User');
const Location = require('./Location');
const Trainer = require('./Trainer');
const MembershipPlan = require('./MembershipPlan');
const Subscription = require('./Subscription');
const Class = require('./Class');
const Booking = require('./Booking');
const Waitlist = require('./Waitlist');
const Payment = require('./Payment');
const Review = require('./Review');
const Promotion = require('./Promotion');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');
const Visit = require('./Visit');
const TrainerAssignment = require('./TrainerAssignment');
const AppSetting = require('./AppSetting');
const LockerSubscription = require('./LockerSubscription');
const PTRequest = require('./PTRequest');
const PTPlan = require('./PTPlan');

const ALL_MODELS = [
  User, Location, Trainer, MembershipPlan, Subscription,
  Class, Booking, Waitlist, Payment, Review, Promotion, Notification, AuditLog,
  Visit, TrainerAssignment, AppSetting, LockerSubscription, PTRequest, PTPlan,
];
for (const Model of ALL_MODELS) {
  const original = Model.prototype.toJSON;
  Model.prototype.toJSON = function () {
    const values = original ? original.call(this) : { ...this.get() };
    if (values.id !== undefined && values._id === undefined) {
      values._id = values.id;
    }
    return values;
  };
}

User.hasMany(Subscription, { foreignKey: 'userId' });
Subscription.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Booking, { foreignKey: 'userId' });
Booking.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Waitlist, { foreignKey: 'userId' });
Waitlist.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Payment, { foreignKey: 'userId' });
Payment.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Trainer, { foreignKey: 'userId' });
Trainer.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Visit, { foreignKey: 'userId' });
Visit.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Visit, { foreignKey: 'checkedInByUserId', as: 'CheckedInVisits' });
Visit.belongsTo(User, { foreignKey: 'checkedInByUserId', as: 'CheckedInBy' });

Visit.belongsTo(Location, { foreignKey: 'locationId' });
Location.hasMany(Visit, { foreignKey: 'locationId' });

User.hasMany(TrainerAssignment, { foreignKey: 'userId', as: 'TrainerAssignments' });
TrainerAssignment.belongsTo(User, { foreignKey: 'userId' });

Trainer.hasMany(TrainerAssignment, { foreignKey: 'trainerId' });
TrainerAssignment.belongsTo(Trainer, { foreignKey: 'trainerId' });

User.hasMany(TrainerAssignment, { foreignKey: 'assignedByUserId', as: 'AssignedByAssignments' });
TrainerAssignment.belongsTo(User, { foreignKey: 'assignedByUserId', as: 'AssignedBy' });

Location.hasMany(Class, { foreignKey: 'locationId' });
Class.belongsTo(Location, { foreignKey: 'locationId' });

Location.hasMany(Trainer, { foreignKey: 'locationId' });
Trainer.belongsTo(Location, { foreignKey: 'locationId' });

Trainer.hasMany(Class, { foreignKey: 'trainerId' });
Class.belongsTo(Trainer, { foreignKey: 'trainerId' });

Trainer.hasMany(Review, { foreignKey: 'trainerId' });
Review.belongsTo(Trainer, { foreignKey: 'trainerId' });

MembershipPlan.hasMany(Subscription, { foreignKey: 'planId' });
Subscription.belongsTo(MembershipPlan, { foreignKey: 'planId', as: 'plan' });

Class.hasMany(Booking, { foreignKey: 'classId' });
Booking.belongsTo(Class, { foreignKey: 'classId' });

Class.hasMany(Waitlist, { foreignKey: 'classId' });
Waitlist.belongsTo(Class, { foreignKey: 'classId' });

Class.hasMany(Review, { foreignKey: 'classId' });
Review.belongsTo(Class, { foreignKey: 'classId' });

Subscription.belongsTo(Location, { foreignKey: 'locationId' });

Payment.belongsTo(Subscription, { foreignKey: 'subscriptionId' });

User.hasMany(LockerSubscription, { foreignKey: 'userId' });
LockerSubscription.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(PTRequest, { foreignKey: 'userId' });
PTRequest.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(PTRequest, { foreignKey: 'confirmedById', as: 'ConfirmedPTRequests' });
PTRequest.belongsTo(User, { foreignKey: 'confirmedById', as: 'ConfirmedBy' });

PTPlan.hasMany(PTRequest, { foreignKey: 'ptPlanId' });
PTRequest.belongsTo(PTPlan, { foreignKey: 'ptPlanId', as: 'plan' });

module.exports = {
  sequelize,
  User,
  Location,
  Trainer,
  MembershipPlan,
  Subscription,
  Class,
  Booking,
  Waitlist,
  Payment,
  Review,
  Promotion,
  Notification,
  AuditLog,
  Visit,
  TrainerAssignment,
  AppSetting,
  LockerSubscription,
  PTRequest,
  PTPlan,
};
