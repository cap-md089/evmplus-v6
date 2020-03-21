import {
	api,
	ClientErrorObject,
	ErrorResolvedStatus,
	Errors,
	ErrorStack,
	NewClientErrorObject,
	right
} from 'common-lib';
import {
	asyncEitherHandler,
	BasicConditionalMemberRequest,
	generateResults,
	Validator
} from '../../lib/internals';

export const ClientErrorValidator = new Validator<NewClientErrorObject>({
	componentStack: {
		validator: Validator.String
	},
	message: {
		validator: Validator.String
	},
	pageURL: {
		validator: Validator.String
	},
	resolved: {
		validator: Validator.Enum<ErrorResolvedStatus>(ErrorResolvedStatus)
	},
	stack: {
		validator: Validator.ArrayOf(
			new Validator<ErrorStack>({
				column: {
					validator: Validator.Number
				},
				filename: {
					validator: Validator.String
				},
				line: {
					validator: Validator.Number
				},
				name: {
					validator: Validator.String
				}
			})
		)
	},
	timestamp: {
		validator: Validator.Number
	},
	type: {
		validator: Validator.StrictValue<'Client'>('Client')
	}
});

export default asyncEitherHandler<api.errors.ClientError>(
	async (req: BasicConditionalMemberRequest) => {
		const info = req.body as NewClientErrorObject;

		console.error('Client error!', info.message);

		const errorCollection = req.mysqlx.getCollection<Errors>('Errors');
		let id = 0;

		// Get the ID for the new error
		{
			const errorGenerator = generateResults(errorCollection.find('true'));

			for await (const error of errorGenerator) {
				id = Math.max(id, error.id);
			}

			id++;
		}

		// Add the error to the database
		{
			const errorObject: ClientErrorObject = {
				componentStack: info.componentStack,
				accountID: req.account.id,
				id,
				pageURL: info.pageURL,
				type: 'Client',
				stack: info.stack.map(item => ({
					name: item.name,
					filename: item.filename,
					line: item.line,
					column: item.column
				})),
				resolved: ErrorResolvedStatus.UNRESOLVED,
				message: info.message,
				timestamp: Date.now(),
				user: req.member ? req.member.getReference() : null
			};

			await errorCollection.add(errorObject).execute();

			return right(void 0);
		}
	}
);
